export type Outcome = 'yes' | 'no';

const LABELS: Record<Outcome, string> = { yes: 'Отпустило', no: 'Не отпустило' };
const ITEMS = 64;

interface ReelOptions {
  reduceMotion: boolean;
  onTick: () => void;
}

/** Лента барабана: чётные ячейки — «отпустило», нечётные — «не отпустило». */
export function createReel(strip: HTMLElement, { reduceMotion, onTick }: ReelOptions) {
  for (let i = 0; i < ITEMS; i++) {
    const kind: Outcome = i % 2 === 0 ? 'yes' : 'no';
    const item = document.createElement('div');
    item.className = `item item--${kind}`;
    const label = document.createElement('span');
    label.textContent = LABELS[kind];
    item.append(label);
    strip.append(item);
  }

  const rootStyle = getComputedStyle(document.documentElement);
  const itemH = parseFloat(rootStyle.getPropertyValue('--item-h'));
  const reelH = parseFloat(rootStyle.getPropertyValue('--reel-h'));
  const yFor = (index: number) => -index * itemH + (reelH - itemH) / 2;
  const translate = (y: number) => `translateY(${y}px)`;

  let current = 3;
  strip.style.transform = translate(yFor(current));

  async function spin(outcome: Outcome): Promise<void> {
    const rounds = 18 + Math.floor(Math.random() * 6);
    let target = current + rounds * 2;
    if ((target % 2 === 0) !== (outcome === 'yes')) target += 1;

    const duration = reduceMotion ? 900 : 2600 + Math.random() * 500;
    if (!reduceMotion) strip.classList.add('is-blurred');
    const unblur = setTimeout(() => strip.classList.remove('is-blurred'), duration * 0.62);

    // вибрация на каждой проходящей ячейке
    let ticking = true;
    let lastIdx = current;
    let lastTick = 0;
    const watch = (now: number) => {
      if (!ticking) return;
      const y = new DOMMatrix(getComputedStyle(strip).transform).m42;
      const idx = Math.round(((reelH - itemH) / 2 - y) / itemH);
      if (idx !== lastIdx && now - lastTick > 45) {
        onTick();
        lastTick = now;
      }
      lastIdx = idx;
      requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);

    const overshoot = yFor(target) - 14;
    const run = strip.animate(
      [{ transform: translate(yFor(current)) }, { transform: translate(overshoot) }],
      { duration, easing: 'cubic-bezier(.12,.62,.16,1)', fill: 'forwards' },
    );
    await run.finished;
    const settle = strip.animate(
      [{ transform: translate(overshoot) }, { transform: translate(yFor(target)) }],
      { duration: 380, easing: 'cubic-bezier(.34,1.8,.5,1)', fill: 'forwards' },
    );
    await settle.finished;
    ticking = false;
    clearTimeout(unblur);
    strip.classList.remove('is-blurred');

    // лента повторяется через 2 ячейки — незаметно возвращаемся к началу
    current = 2 + (target % 2);
    strip.style.transform = translate(yFor(current));
    run.cancel();
    settle.cancel();
  }

  return { spin };
}
