// ─────────────────────────────────────────────────────────────
//  Spine 3.8 (WebGL) 헬퍼 — week1/kingdom/src/spine-runtime.js 에서 이식
//  데이터: Unity export (.skel.bytes / .atlas.txt, premultiplied alpha)
// ─────────────────────────────────────────────────────────────
const RUNTIME = '/vendor/spine-webgl-3.8.js';
export const SPINE_BASE = '/cocobi/spine/';
let promise = null;

export function loadSpineRuntime() {
  if (window.spine) return Promise.resolve(window.spine);
  promise ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = RUNTIME;
    s.onload = () => resolve(window.spine);
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return promise;
}

function waitForAssets(assets) {
  return new Promise((resolve, reject) => {
    const check = () => {
      if (assets.hasErrors()) return reject(assets.getErrors());
      if (assets.isLoadingComplete()) return resolve();
      requestAnimationFrame(check);
    };
    check();
  });
}

// 이름이 정확히 없으면 '…/이름' 으로 끝나는 애니메이션 (예: 'vs' → 'common/vs'), 그래도 없으면 첫 번째
function pickAnimation(data, want) {
  const names = data.animations.map((a) => a.name);
  return names.find((n) => n === want) || names.find((n) => n.endsWith('/' + want)) || names[0];
}

// 애니메이션 한 바퀴 동안의 최대 외곽 박스
function measure(spine, skeleton, state, anim, duration, ignore = []) {
  state.setAnimation(0, anim, true);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const skip = new Set(ignore);
  let verts = new Float32Array(8);
  const steps = 12;
  for (let s = 0; s <= steps; s++) {
    state.update(s === 0 ? 0 : duration / steps);
    state.apply(skeleton);
    skeleton.x = 0; skeleton.y = 0; skeleton.scaleX = 1; skeleton.scaleY = 1;
    skeleton.updateWorldTransform();
    for (const slot of skeleton.drawOrder) {
      const at = slot.getAttachment();
      if (!at || skip.has(slot.data.name) || slot.color.a === 0) continue;
      let n = 0;
      if (at instanceof spine.RegionAttachment) {
        at.computeWorldVertices(slot.bone, verts, 0, 2); n = 8;
      } else if (at instanceof spine.MeshAttachment) {
        n = at.worldVerticesLength;
        if (verts.length < n) verts = new Float32Array(n);
        at.computeWorldVertices(slot, 0, n, verts, 0, 2);
      } else continue;
      for (let i = 0; i < n; i += 2) {
        minX = Math.min(minX, verts[i]); maxX = Math.max(maxX, verts[i]);
        minY = Math.min(minY, verts[i + 1]); maxY = Math.max(maxY, verts[i + 1]);
      }
    }
  }
  skeleton.setToSetupPose();
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/**
 * 캔버스 하나에 여러 Spine 캐릭터를 올리는 무대.
 * defs: [{ spine, skin, animation, measureIgnore }]
 * 반환: { spine, renderer, actors[], resize(), begin(), draw(actor, x, y, scale, flip, dt), end() }
 */
export async function createStage(canvas, defs, { preserve = false } = {}) {
  const spine = await loadSpineRuntime();
  const ctx = new spine.webgl.ManagedWebGLRenderingContext(canvas, { alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: preserve });
  const renderer = new spine.webgl.SceneRenderer(canvas, ctx);
  const assets = new spine.webgl.AssetManager(ctx, SPINE_BASE);
  const files = [...new Set(defs.map((d) => d.spine))];
  files.forEach((f) => {
    assets.loadBinary(`${f}.skel.bytes`);
    assets.loadTextureAtlas(`${f}.atlas.txt`);
  });
  await waitForAssets(assets);

  const actors = defs.map((d) => {
    const atlas = assets.get(`${d.spine}.atlas.txt`);
    const data = new spine.SkeletonBinary(new spine.AtlasAttachmentLoader(atlas)).readSkeletonData(assets.get(`${d.spine}.skel.bytes`));
    const skeleton = new spine.Skeleton(data);
    if (d.skin) skeleton.setSkinByName(d.skin);
    skeleton.setSlotsToSetupPose();
    const anim = pickAnimation(data, d.animation);
    const state = new spine.AnimationState(new spine.AnimationStateData(data));
    const box = measure(spine, skeleton, state, anim, data.findAnimation(anim).duration, d.measureIgnore);
    state.setAnimation(0, anim, true);
    return { def: d, skeleton, state, box, anim };
  });

  const dpr = () => Math.min(2, devicePixelRatio || 1);
  const stage = {
    spine, renderer, actors,
    width: 0, height: 0,
    resize(w, h) {
      const r = canvas.getBoundingClientRect();
      stage.width = w ?? r.width;
      stage.height = h ?? r.height;
      canvas.width = Math.round(stage.width * (w ? 1 : dpr()));
      canvas.height = Math.round(stage.height * (h ? 1 : dpr()));
      renderer.camera.setViewport(stage.width, stage.height);
      renderer.camera.position.x = stage.width / 2;
      renderer.camera.position.y = stage.height / 2;
    },
    begin() {
      const gl = renderer.context.gl;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      renderer.camera.update();
      renderer.begin();
    },
    /** (cx, cy): 캐릭터 외곽 박스 중심 위치 (캔버스 좌표, 아래가 0) */
    draw(a, cx, cy, k, flip = false, dt = 0) {
      const f = flip ? -1 : 1;
      a.skeleton.scaleX = k * f;
      a.skeleton.scaleY = k;
      a.skeleton.x = cx - (a.box.x + a.box.w / 2) * k * f;
      a.skeleton.y = cy - (a.box.y + a.box.h / 2) * k;
      a.state.update(dt);
      a.state.apply(a.skeleton);
      a.skeleton.updateWorldTransform();
      renderer.drawSkeleton(a.skeleton, true);
    },
    end() { renderer.end(); },
  };
  return stage;
}

/** 화면에 보일 때만 돌아가는 rAF 루프. onFrame(dt) */
export function visibleLoop(target, onFrame) {
  let visible = false, running = false, last = 0;
  const tick = (t) => {
    if (!visible) { running = false; last = 0; return; }
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
    last = t;
    onFrame(dt);
    requestAnimationFrame(tick);
  };
  const start = () => { if (!running && visible) { running = true; requestAnimationFrame(tick); } };
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; start(); }, { rootMargin: '100px 0px' }).observe(target);
  return { start };
}

/** 가까워지면 한 번 실행 */
export function whenNear(target, fn, margin = '400px 0px') {
  const io = new IntersectionObserver(([en]) => {
    if (!en.isIntersecting) return;
    io.disconnect();
    fn();
  }, { rootMargin: margin });
  io.observe(target);
}
