// 코코비 핑크 블랙 히어로 — interactions
import { createStage, visibleLoop, whenNear } from './spine.js';
import { stickerTrail } from './cta.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const isDesktop = () => matchMedia('(min-width: 1100px)').matches;
const C = (f) => `/cocobi/${f}`;

/* ─────────────────────────────────────────────
   Toast
   ───────────────────────────────────────────── */
const toast = (() => {
  const el = document.createElement('div');
  el.className = 'toast';
  document.body.append(el);
  let t;
  return (msg) => {
    el.textContent = msg;
    el.classList.add('is-show');
    clearTimeout(t);
    t = setTimeout(() => el.classList.remove('is-show'), 1800);
  };
})();

/* ─────────────────────────────────────────────
   Header: util bar 스크롤 아웃 → GNB 상단 고정 + scroll spy
   ───────────────────────────────────────────── */
const gnb = $('.gnb');
const UTIL_H = 36;
const spyLinks = $$('.gnb-menu a[data-scroll]');
const spySections = spyLinks.map((a) => $(a.getAttribute('href')));
let ticking = false;
function onScroll() {
  const y = window.scrollY;
  if (gnb) gnb.style.transform = `translateY(${-Math.min(y, UTIL_H)}px)`;
  const mid = y + window.innerHeight * 0.35;
  let idx = -1;
  spySections.forEach((s, i) => { if (s && s.offsetTop <= mid) idx = i; });
  spyLinks.forEach((a, i) => a.classList.toggle('is-active', i === idx));
  ticking = false;
}
window.addEventListener('scroll', () => {
  if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
}, { passive: true });

$$('[data-scroll]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const target = $(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    closeMobileNav();
    const offset = isDesktop() && target.id !== 'top' ? 64 : 0;
    window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
  });
});

/* ─────────────────────────────────────────────
   Mobile nav
   ───────────────────────────────────────────── */
const mNav = $('.m-nav');
const burger = $('.m-burger');
function openMobileNav() {
  mNav.classList.add('is-open');
  mNav.setAttribute('aria-hidden', 'false');
  burger.setAttribute('aria-expanded', 'true');
  document.body.classList.add('is-locked');
}
function closeMobileNav() {
  if (!mNav.classList.contains('is-open')) return;
  mNav.classList.remove('is-open');
  mNav.setAttribute('aria-hidden', 'true');
  burger.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('is-locked');
}
burger.addEventListener('click', openMobileNav);
$('.m-nav-close').addEventListener('click', closeMobileNav);
$$('.m-nav a:not([data-scroll])').forEach((a) => a.addEventListener('click', closeMobileNav));

/* ─────────────────────────────────────────────
   Hero 배경 영상: 엔딩('PLAY NOW') 전 43초에서 처음으로
   ───────────────────────────────────────────── */
(() => {
  const v = $('.hero-video');
  const END = 43;
  v.addEventListener('timeupdate', () => { if (v.currentTime >= END) v.currentTime = 0; });
  v.play?.().catch(() => {});
})();

/* ─────────────────────────────────────────────
   게임소개 slider (slick fade 동작 재현)
   ───────────────────────────────────────────── */
(() => {
  const slides = $$('.feature-slide');
  const tabs = $$('#contents .tab');
  const dotsWrap = $('#contents .dots');
  const track = $('.feature-track');
  const AUTOPLAY = 5000;
  let cur = 0;
  let timer;

  slides.forEach((_, i) => {
    const li = document.createElement('li');
    li.addEventListener('click', () => go(i));
    dotsWrap.append(li);
  });
  const dots = $$('li', dotsWrap);

  function go(i) {
    cur = (i + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('active', k === cur));
    tabs.forEach((t, k) => t.classList.toggle('active', k === cur));
    dots.forEach((d, k) => d.classList.toggle('active', k === cur));
    restart();
  }
  function restart() {
    clearInterval(timer);
    timer = setInterval(() => go(cur + 1), AUTOPLAY);
  }

  tabs.forEach((t, i) => t.addEventListener('click', () => go(i)));
  $('.feature-arrow--prev').addEventListener('click', () => go(cur - 1));
  $('.feature-arrow--next').addEventListener('click', () => go(cur + 1));
  const feature = $('.feature');
  feature.addEventListener('mouseenter', () => clearInterval(timer));
  feature.addEventListener('mouseleave', restart);

  let startX = null;
  track.addEventListener('pointerdown', (e) => { startX = e.clientX; track.classList.add('is-dragging'); });
  window.addEventListener('pointerup', (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1));
    startX = null;
    track.classList.remove('is-dragging');
  });

  new IntersectionObserver(([en]) => (en.isIntersecting ? restart() : clearInterval(timer)), { threshold: 0.2 }).observe(feature);
  go(0);
})();

/* ─────────────────────────────────────────────
   캐릭터 데이터 (Spine 설정은 week1/kingdom 에서 검증된 값)
   face: [머리 중심 x%, y% (스티커 기준), 확대 배율] → 아이콘에 머리가 들어오도록
   ───────────────────────────────────────────── */
const CHARACTERS = [
  {
    category: '히어로',
    fit: [1.05, 0.86],   // 카드 폭/높이 대비 최대 크기 (두 히어로 같은 배율)
    items: [
      { spine: 'coco_pink', skin: 'magic', animation: 'common/pose', tone: 'pink', name: '핑크 코코',
        quote: '“사랑의 힘으로 널 용서하지 않겠어!”',
        desc: '달콤한 사랑의 힘으로 나쁜 마음을 정화하는 핑크 히어로! 팬던트에 마법의 기운을 담아 화려한 모습으로 변신해요.' },
      { spine: 'coco_black', skin: 'magic', animation: 'common/pose', tone: 'black', name: '블랙 코코',
        quote: '“어둠의 힘으로 널 용서하지 않겠어!”',
        desc: '강력한 어둠의 힘으로 몬스터를 제압하는 블랙 히어로! 구조, 마을 정비, 보스 전투까지 핑크 코코와 함께 출동해요.' },
    ],
  },
];

// 몬스터 섹션 데이터 (스티커 아이콘 + Spine 'vs' 애니메이션)
const MONSTERS = [
  { spine: 'icetyranno', animation: 'vs', icon: 'sticker_icetyranno.png', face: [33, 22, 1.8], name: '아이스크림 티라노',
    quote: '“꽁꽁 얼려 주마! 아이스크림 발사~!”', desc: '차가운 아이스크림을 마구 발사하는 몬스터. 피하지 않으면 몸이 꽁꽁 얼어버려요!' },
  { spine: 'mosquito', skin: 'color', animation: 'vs', icon: 'sticker_mosquito.png', face: [39, 40, 2.2], name: '무지개 모기',
    quote: '“알록달록한 색깔은 전부 내 거야!”', desc: '무지개 침에 맞으면 색을 빼앗겨요. 날쌘 모기를 조심해야 해요!' },
  { spine: 'tank', animation: 'vs', icon: 'sticker_tank.png', face: [38, 66, 2.1], measureIgnore: ['tank_bomb'], name: '코딱지 탱크',
    quote: '“끈적끈적 코딱지 폭탄 맛 좀 봐라!”', desc: '코딱지 폭탄 속에는 끈적한 콧물이 가득! 맞기 전에 먼저 터뜨려야 해요.' },
  { spine: 'shark', animation: 'vs', icon: 'sticker_tyrannoshark.png', face: [57, 20, 1.5], name: '티라노 상어',
    quote: '“바닷속은 내 구역이다, 쿠아앙!”', desc: '바닷속에서 빠르게 돌진하는 몬스터. 재빠르게 움직여 무찔러요!' },
  { spine: 'firetruck', skin: 'phase_0', animation: 'vs', icon: 'sticker_firetruck.png', face: [35, 53, 1.8], name: '코끼리 소방차',
    quote: '“뿌우~ 물대포 발사!”', desc: '코끼리 코로 물대포를 발사해요. 마법 광선으로 힘겨루기 한판!' },
  { spine: 'princess', skin: '0', animation: 'vs', icon: 'sticker_princess.png', face: [45, 30, 2.3], name: '좀비 프린세스',
    quote: '“모두 나의 좀비 친구가 되어라~”', desc: '좀비 떼가 몰려와요! 좀비들을 막아내고 공주님을 원래 모습으로 되돌려요.' },
  { spine: 'crane', skin: '0', animation: 'vs', icon: 'sticker_crane.png', face: [39, 63, 2.0], name: '티라노 크레인',
    quote: '“공사 장비 받아라, 쿵! 쾅!”', desc: '몬스터가 던지는 공사 장비들을 막아내면 거인으로 변신할 수 있어요!' },
  { spine: 'pepper', skin: '0', animation: 'vs', icon: 'sticker_pepper.png', face: [44, 39, 1.4], name: '고추사탕 괴물',
    quote: '“화끈한 고추사탕 하나 먹어 볼래?”', desc: '고추맛 사탕은 무척 뜨겁고 매콤해요. 닿으면 화상을 입을지도 몰라요!' },
];

/* ─────────────────────────────────────────────
   캐릭터 섹션: 탭 / 아이콘 / 카드 + Spine / 정보
   ───────────────────────────────────────────── */
(() => {
  const section = $('#character');
  const tabsWrap = $('.char-tabs');
  const list = $('.char-list');
  const wrap = $('.char');
  const card = $('.char-card');
  const cardBg = $('.char-card-bg');
  const canvas = $('.char-canvas');
  const elCat = $('.char-cat');
  const elName = $('.char-name');
  const elQuote = $('.char-quote');
  const elDesc = $('.char-desc');
  const heroSnaps = {}; // spine 이름 → 아이콘용 스냅샷 dataURL
  let cat = 0;
  let idx = 0;
  let switching;
  let stage = null;
  let current = null; // 지금 그리는 actor

  CHARACTERS.forEach((c, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<button type="button" class="tab" role="tab"><span>${c.category}</span></button>`;
    li.firstElementChild.addEventListener('click', () => selectCategory(i));
    tabsWrap.append(li);
  });
  const catTabs = $$('.tab', tabsWrap);
  tabsWrap.hidden = CHARACTERS.length < 2;

  const cardOf = (it) => C(it.tone === 'pink' ? 'hero-card-pink.png' : 'hero-card-black.png');

  function iconHTML(it) {
    if (it.icon) {
      const [fx, fy, zoom] = it.face;
      return `<span class="char-icon"><span class="char-icon-inner"><img src="${C(it.icon)}" alt="${it.name}" style="width:${zoom * 100}%;transform:translate(-${fx}%,-${fy}%)" /></span></span>`;
    }
    const snap = heroSnaps[it.spine];
    return `<span class="char-icon ${it.tone === 'black' ? 'char-icon--black' : ''}">${snap ? `<img class="is-snap" src="${snap}" alt="${it.name}" />` : ''}</span>`;
  }

  function renderList() {
    list.innerHTML = '';
    CHARACTERS[cat].items.forEach((it, i) => {
      const li = document.createElement('li');
      li.innerHTML = iconHTML(it);
      li.addEventListener('click', () => select(i));
      list.append(li);
    });
  }

  function apply() {
    const group = CHARACTERS[cat];
    const it = group.items[idx];
    cardBg.src = cardOf(it);
    elCat.textContent = group.category;
    elCat.classList.toggle('is-black', it.tone === 'black' || !it.tone);
    elName.textContent = it.name;
    elQuote.textContent = it.quote;
    elDesc.textContent = it.desc;
    $$('li', list).forEach((li, i) => li.classList.toggle('active', i === idx));
    if (stage) {
      current = stage.actors.find((a) => a.def === it);
      current.state.setAnimation(0, current.anim, true); // 처음부터 다시 재생
    }
  }

  function select(i, immediate = false) {
    const n = CHARACTERS[cat].items.length;
    idx = (i + n) % n;
    $$('li', list).forEach((li, k) => li.classList.toggle('active', k === idx));
    if (immediate) return apply();
    clearTimeout(switching);
    wrap.classList.add('is-switching');            // fade out .3s
    switching = setTimeout(() => {
      apply();
      requestAnimationFrame(() => wrap.classList.remove('is-switching')); // fade in .3s
    }, 300);
  }

  function selectCategory(i) {
    cat = i;
    catTabs.forEach((t, k) => t.classList.toggle('active', k === cat));
    renderList();
    select(0);
  }

  $('.char-nav-prev').addEventListener('click', () => select(idx - 1));
  $('.char-nav-next').addEventListener('click', () => select(idx + 1));

  /* ── 카드 위치에 맞춰 그리기 ── */
  function scaleFor(groupIdx, a) {
    const group = CHARACTERS[groupIdx];
    const cr = $('.char-card-frame').getBoundingClientRect();
    const [fw, fh] = group.fit;
    const fitOne = (b) => Math.min((cr.width * fw) / b.w, (cr.height * fh) / b.h);
    // 히어로는 둘 다 같은 배율(작은 쪽) → 핑크/블랙 크기 동일
    if (groupIdx === 0) return Math.min(...stage.actors.filter((x) => group.items.includes(x.def)).map((x) => fitOne(x.box)));
    return fitOne(a.box);
  }

  function frame(dt) {
    if (!stage || !current) return;
    const cv = canvas.getBoundingClientRect();
    const cr = $('.char-card-frame').getBoundingClientRect();
    const groupIdx = CHARACTERS.findIndex((g) => g.items.includes(current.def));
    const k = scaleFor(groupIdx, current);
    const cx = cr.left - cv.left + cr.width / 2;
    const cy = cv.bottom - (cr.top + cr.height / 2) - cr.height * 0.02;
    stage.begin();
    stage.draw(current, cx, cy, k, !!CHARACTERS[groupIdx].flip, dt);
    stage.end();
  }

  /* ── 히어로 아이콘 스냅샷: 머리 위주로 정사각 캡처 ── */
  function snapshotHeroes() {
    const S = 240;
    stage.resize(S, S);
    CHARACTERS[0].items.forEach((it) => {
      const a = stage.actors.find((x) => x.def === it);
      const k = (S * 1.05) / a.box.w;
      stage.begin();
      // 외곽 박스 위쪽(머리)을 캔버스 위에 맞춤
      stage.draw(a, S / 2, S - (a.box.h / 2) * k + S * 0.06, k, false, 0);
      stage.end();
      heroSnaps[it.spine] = canvas.toDataURL('image/png');
    });
    stage.resize();
  }

  catTabs[0].classList.add('active');
  renderList();
  select(0, true);

  whenNear(section, async () => {
    try {
      const defs = CHARACTERS.flatMap((g) => g.items);
      stage = await createStage(canvas, defs, { preserve: true });
      if (import.meta.env?.DEV) window.__charStage = stage;
      snapshotHeroes();
      renderList();
      $$('li', list).forEach((li, i) => li.classList.toggle('active', i === idx));
      current = stage.actors.find((a) => a.def === CHARACTERS[cat].items[idx]);
      card.classList.add('is-ready');
      addEventListener('resize', () => stage.resize());
      visibleLoop(card, frame).start();
    } catch (e) {
      console.warn('[character] Spine 로딩 실패', e);
    }
  });
})();

/* ─────────────────────────────────────────────
   몬스터 섹션: 아이콘 그리드 → 큰 Spine 몬스터(좌우 화살표) → 이름 · 대사 · 설명
   전환: 몬스터는 이동 방향으로 밀려나며 페이드, 정보는 아래에서 페이드 인
   ───────────────────────────────────────────── */
(() => {
  const section = $('#monsters');
  const grid = $('.mon-grid');
  const stageEl = $('.mon-stage');
  const canvas = $('.mon-canvas');
  const info = $('.mon-info');
  const elName = $('.mon-name-text');
  const elQuote = $('.mon-quote');
  const elDesc = $('.mon-desc');
  const FIT = 0.9;      // 무대 대비 크기
  const FLIP = true;    // Spine 원본이 왼쪽을 바라봄 → 오른쪽을 보도록
  let idx = 0;
  let stage = null;
  let current = null;
  let timer;

  MONSTERS.forEach((m, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mon-tile';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', m.name);
    const [fx, fy, zoom] = m.face;
    b.innerHTML = `<img src="${C(m.icon)}" alt="" loading="lazy" style="width:${zoom * 100}%;transform:translate(-${fx}%,-${fy}%)" />`;
    b.addEventListener('click', () => select(i));
    grid.append(b);
  });
  const tiles = $$('.mon-tile', grid);

  function apply() {
    const m = MONSTERS[idx];
    elName.textContent = m.name;
    elQuote.textContent = m.quote;
    elDesc.textContent = m.desc;
    if (stage) {
      current = stage.actors[idx];
      current.state.setAnimation(0, current.anim, true);
    }
  }

  function select(i, dir) {
    const n = MONSTERS.length;
    const next = (i + n) % n;
    if (dir === undefined) dir = next > idx ? 1 : -1;
    idx = next;
    tiles.forEach((t, k) => {
      t.classList.toggle('is-active', k === idx);
      t.setAttribute('aria-selected', k === idx);
    });
    clearTimeout(timer);
    section.style.setProperty('--dir', dir);
    section.classList.add('is-leaving');
    timer = setTimeout(() => {
      apply();
      section.classList.remove('is-leaving');
      section.classList.add('is-entering');
      requestAnimationFrame(() => requestAnimationFrame(() => section.classList.remove('is-entering')));
    }, 260);
  }

  $('.mon-arrow--prev').addEventListener('click', () => select(idx - 1, -1));
  $('.mon-arrow--next').addEventListener('click', () => select(idx + 1, 1));

  // 스와이프
  let sx = null;
  stageEl.addEventListener('pointerdown', (e) => { if (!e.target.closest('.mon-arrow')) sx = e.clientX; });
  addEventListener('pointerup', (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx;
    sx = null;
    if (Math.abs(dx) > 40) select(idx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  });

  tiles[0].classList.add('is-active');
  apply();

  whenNear(section, async () => {
    try {
      stage = await createStage(canvas, MONSTERS);
      stage.resize();
      addEventListener('resize', () => stage.resize());
      current = stage.actors[idx];
      stageEl.classList.add('is-ready');
      visibleLoop(stageEl, (dt) => {
        const W = stage.width, H = stage.height;
        const a = current;
        const k = Math.min((W * FIT) / a.box.w, (H * FIT) / a.box.h);
        stage.begin();
        stage.draw(a, W / 2, H / 2, k, FLIP, dt);
        stage.end();
      }).start();
    } catch (e) {
      console.warn('[monsters] Spine 로딩 실패', e);
    }
  });
})();

/* ─────────────────────────────────────────────
   스크롤 등장: .reveal → 화면에 들어오면 아래에서 1.2s 떠오름 (--delay 순서대로)
   ───────────────────────────────────────────── */
(() => {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    });
  }, { threshold: 0.15 });
  $$('.reveal').forEach((el) => io.observe(el));
})();

/* ─────────────────────────────────────────────
   스토리: 구름 위 핑크/블랙 코코 (Spine)
   ───────────────────────────────────────────── */
(() => {
  const canvas = $('.story-canvas');
  const defs = [
    { spine: 'coco_pink', skin: 'magic', animation: 'common/pose' },
    { spine: 'coco_black', skin: 'magic', animation: 'common/pose' },
  ];
  whenNear(canvas, async () => {
    try {
      const stage = await createStage(canvas, defs);
      stage.resize();
      addEventListener('resize', () => stage.resize());
      const [pink, black] = stage.actors;
      visibleLoop(canvas, (dt) => {
        const W = stage.width, H = stage.height;
        const k = Math.min((W * 0.46) / Math.max(pink.box.w, black.box.w), (H * 0.95) / Math.max(pink.box.h, black.box.h));
        stage.begin();
        stage.draw(pink, W * 0.3, H * 0.5, k, false, dt);
        stage.draw(black, W * 0.7, H * 0.5, k, false, dt);
        stage.end();
      }).start();
    } catch (e) {
      console.warn('[story] Spine 로딩 실패', e);
    }
  });
})();

/* ─────────────────────────────────────────────
   Video modal (YouTube / mp4) — 코코비 모니터 프레임
   ───────────────────────────────────────────── */
(() => {
  const modal = $('.modal');
  const body = $('.modal-body');
  let lastFocus;
  const open = (btn) => {
    lastFocus = document.activeElement;
    const { youtube, list, mp4 } = btn.dataset;
    if (youtube) {
      const q = new URLSearchParams({ autoplay: '1', rel: '0', playsinline: '1' });
      if (list) q.set('list', list);
      body.innerHTML = `<iframe src="https://www.youtube.com/embed/${youtube}?${q}" title="코코비 핑크 블랙 영상" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    } else if (mp4) {
      body.innerHTML = `<video src="${mp4}" controls autoplay playsinline></video>`;
    }
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    $('.hero-video').pause();
    $('.modal-close').focus();
  };
  const close = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    setTimeout(() => { body.innerHTML = ''; }, 300); // 재생 중지
    $('.hero-video').play().catch(() => {});
    lastFocus?.focus();
  };
  $$('.js-open-video').forEach((b) => b.addEventListener('click', () => open(b)));
  $('.modal-dim').addEventListener('click', close);
  $('.modal-close').addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (modal.classList.contains('is-open')) close();
    closeMobileNav();
  });
})();

/* ─────────────────────────────────────────────
   Footer: 몬스터 스티커 트레일 + 잭잭 커서
   ───────────────────────────────────────────── */
stickerTrail($('.footer'), {
  trail: ['icetyranno', 'mosquito', 'tank', 'tyrannoshark', 'firetruck', 'princess', 'crane', 'pepper'].map((k) => C(`sticker_${k}.png`)),
  trailSpacing: 8,
  trailInertia: { multiplier: 4, duration: 1.5 },
  trailBase: 600,
  cursor: [C('jj_cursor_0.png'), C('jj_cursor_1.png')],
  cursorFps: 5,
});

$$('.util-right a, .footer-links a').forEach((a) => a.addEventListener('click', (e) => {
  if (a.getAttribute('href') === '#') { e.preventDefault(); toast('준비 중인 페이지입니다.'); }
}));

onScroll();
