/** Лампочки по периметру табло; пересчитываются при изменении размера. */
export function layoutBulbs(container: HTMLElement, step = 19): void {
  container.replaceChildren();
  const w = container.clientWidth;
  const h = container.clientHeight;
  const points: Array<[number, number]> = [];
  const edge = (x1: number, y1: number, x2: number, y2: number) => {
    const n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / step));
    for (let i = 0; i < n; i++) points.push([x1 + ((x2 - x1) * i) / n, y1 + ((y2 - y1) * i) / n]);
  };
  edge(0, 0, w, 0);
  edge(w, 0, w, h);
  edge(w, h, 0, h);
  edge(0, h, 0, 0);

  points.forEach(([x, y], i) => {
    const bulb = document.createElement('i');
    bulb.style.left = `${x}px`;
    bulb.style.top = `${y}px`;
    bulb.style.setProperty('--i', String(i % 3));
    container.append(bulb);
  });
}

/** Монеты, разлетающиеся из центра барабана при выигрыше. */
export function burstCoins(layer: HTMLElement, origin: HTMLElement, count = 22): void {
  const box = layer.getBoundingClientRect();
  const from = origin.getBoundingClientRect();
  const cx = from.left - box.left + from.width / 2;
  const cy = from.top - box.top + from.height / 2;

  for (let i = 0; i < count; i++) {
    const coin = document.createElement('span');
    coin.className = 'coin';
    coin.style.setProperty('--x', `${cx}px`);
    coin.style.setProperty('--y', `${cy}px`);
    coin.style.setProperty('--dx', `${(Math.random() - 0.5) * 360}px`);
    coin.style.setProperty('--dy', `${-120 - Math.random() * 180}px`);
    coin.style.setProperty('--d', `${Math.random() * 180}ms`);
    coin.addEventListener('animationend', () => coin.remove());
    layer.append(coin);
  }
}
