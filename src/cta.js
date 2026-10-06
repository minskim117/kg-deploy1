// ─────────────────────────────────────────────────────────────
//  푸터 연출 (week1/kingdom/src/cta.js 에서 이식)
//  - 마우스를 움직이면 몬스터 스티커가 튀어나와 관성으로 미끄러지는 트레일
//  - 두 프레임을 번갈아 보여주는 잭잭 이미지 커서
// ─────────────────────────────────────────────────────────────
import gsap from 'gsap';

export function stickerTrail(box, c) {
  const trail = box.querySelector('.cta-trail');
  const stickers = c.trail.map((src) => Object.assign(new Image(), { src }));
  const unit = () => gsap.utils.clamp(130, 220, innerWidth * 0.15) / c.trailBase;
  const threshold = () => innerWidth / c.trailSpacing;
  const T = c.trailInertia;
  let tracking = false, px = 0, py = 0, travelled = 0, idx = 0, z = 1;

  const spawn = (x, y, dx, dy) => {
    const st = stickers[idx++ % stickers.length];
    const img = document.createElement('img');
    img.className = 'cta-trail-img';
    img.src = st.src;
    img.alt = '';
    img.draggable = false;
    if (st.naturalWidth) img.style.width = `${Math.round(st.naturalWidth * unit())}px`;
    img.style.zIndex = String(z++);
    trail.appendChild(img);
    const tilt = () => gsap.utils.random(-10, 10);
    gsap.timeline({ onComplete: () => img.remove() })
      .fromTo(img, { xPercent: -50 + gsap.utils.random(-40, 40), yPercent: -50 + gsap.utils.random(-5, 5), scale: 1.3 },
        { scale: 1, duration: 0.6, ease: 'elastic.out(2, 0.6)' })
      .fromTo(img, { x, y, rotation: tilt() },
        { x: `+=${dx * T.multiplier}`, y: `+=${dy * T.multiplier}`, rotation: tilt(), duration: T.duration, ease: 'power4.out' }, '<')
      .to(img, { scale: 0.5, duration: 0.3, delay: 0.1, ease: 'back.in(1.5)' });
  };

  box.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    if (!tracking) { tracking = true; px = e.clientX; py = e.clientY; return; }
    const dx = e.clientX - px, dy = e.clientY - py;
    travelled += Math.abs(dx) + Math.abs(dy);
    if (travelled > threshold()) {
      travelled = 0;
      const r = box.getBoundingClientRect();
      spawn(e.clientX - r.left, e.clientY - r.top, dx, dy);
    }
    px = e.clientX; py = e.clientY;
  });
  box.addEventListener('pointerleave', () => { tracking = false; travelled = 0; });

  // 잭잭 커서 (마우스 기기에서만)
  if (!matchMedia('(pointer: fine)').matches) return;
  c.cursor.forEach((src) => { new Image().src = src; });
  const cur = document.createElement('img');
  cur.className = 'cta-cursor';
  cur.src = c.cursor[0];
  cur.alt = '';
  cur.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cur);
  box.classList.add('has-cursor');
  gsap.set(cur, { xPercent: -50, yPercent: -50, scale: 0, opacity: 0 });
  const cx = gsap.quickTo(cur, 'x', { duration: 0.18, ease: 'power3.out' });
  const cy = gsap.quickTo(cur, 'y', { duration: 0.18, ease: 'power3.out' });
  let frame = 0, timer = null;
  const flip = () => { frame = (frame + 1) % c.cursor.length; cur.src = c.cursor[frame]; };
  box.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'touch') return;
    gsap.set(cur, { x: e.clientX, y: e.clientY });
    gsap.to(cur, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2)' });
    clearInterval(timer);
    timer = setInterval(flip, 1000 / c.cursorFps);
  });
  box.addEventListener('pointermove', (e) => { cx(e.clientX); cy(e.clientY); });
  box.addEventListener('pointerleave', () => {
    gsap.to(cur, { scale: 0, opacity: 0, duration: 0.25, ease: 'power2.in' });
    clearInterval(timer);
  });
}
