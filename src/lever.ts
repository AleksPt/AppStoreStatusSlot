const ROD_LENGTH = 108;
const MAX_ANGLE = (160 * Math.PI) / 180; // ручка «падает» к зрителю
const DRAG_DISTANCE = 190;
const FIRE_AT = 0.92;
const TAP_SLOP = 6;

interface LeverOptions {
  reduceMotion: boolean;
  canPull: () => boolean;
  onPull: () => void;
}

function tween(from: number, to: number, ms: number, ease: (t: number) => number, onUpdate: (v: number) => void) {
  return new Promise<void>((resolve) => {
    const t0 = performance.now();
    const frame = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      onUpdate(from + (to - from) * ease(t));
      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });
}
const easeIn = (t: number) => t * t * t;
const easeOutBack = (t: number) => {
  const c1 = 1.4;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
};

/** Ручка: тянуть вниз, тапнуть или нажать Enter/Space. */
export function createLever(lever: HTMLElement, ball: HTMLElement, { reduceMotion, canPull, onPull }: LeverOptions) {
  let p = 0; // 0 — ручка вверху, 1 — дёрнута до упора

  function setPosition(next: number) {
    p = next;
    const a = p * MAX_ANGLE;
    lever.style.setProperty('--cos', Math.cos(a).toFixed(4));
    lever.style.setProperty('--by', `${(-ROD_LENGTH * Math.cos(a)).toFixed(2)}px`);
    lever.style.setProperty('--bs', (1 + 0.28 * Math.sin(a)).toFixed(4));
  }
  setPosition(0);

  const springBack = () => tween(p, 0, 650, easeOutBack, setPosition);

  function fire() {
    setPosition(1);
    onPull();
    springBack();
  }

  async function autoPull() {
    if (!canPull()) return;
    await tween(p, 1, reduceMotion ? 120 : 260, easeIn, setPosition);
    fire();
  }

  let drag: { y0: number; moved: number; fired: boolean } | null = null;

  ball.addEventListener('pointerdown', (e) => {
    if (!canPull()) return;
    drag = { y0: e.clientY, moved: 0, fired: false };
    ball.setPointerCapture(e.pointerId);
  });

  ball.addEventListener('pointermove', (e) => {
    if (!drag || drag.fired) return;
    const dy = e.clientY - drag.y0;
    drag.moved = Math.max(drag.moved, Math.abs(dy));
    setPosition(Math.min(1, Math.max(0, dy / DRAG_DISTANCE)));
    if (p >= FIRE_AT) {
      drag.fired = true;
      fire();
    }
  });

  const endDrag = () => {
    if (!drag) return;
    const { moved, fired } = drag;
    drag = null;
    if (fired) return;
    if (moved < TAP_SLOP) autoPull();
    else springBack();
  };
  ball.addEventListener('pointerup', endDrag);
  ball.addEventListener('pointercancel', endDrag);

  ball.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      autoPull();
    }
  });

  return {
    setHint: (on: boolean) => lever.classList.toggle('is-hint', on),
  };
}
