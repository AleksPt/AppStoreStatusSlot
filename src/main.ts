import './style.css';
import { haptic, initTelegram } from './telegram';
import { createReel, type Outcome } from './reel';
import { createLever } from './lever';
import { burstCoins, layoutBulbs } from './effects';

const MESSAGES: Record<Outcome | 'idle' | 'spinning', string> = {
  idle: 'Дёрни за ручку',
  spinning: 'Проверяем статус…',
  yes: 'Грузим прилы!',
  no: 'Всем прилам РЕДЖЕКТ',
};

function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} not found`);
  return el as T;
}

initTelegram();

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const machine = byId('machine');
const statusEl = byId('status');
const bulbs = byId('bulbs');
const fx = byId('fx');
const reelWindow = byId('window');

type MachineState = 'spinning' | 'win' | 'lose' | null;
function setState(state: MachineState) {
  machine.classList.remove('is-spinning', 'is-win', 'is-lose');
  if (state) machine.classList.add(`is-${state}`);
}

/** Честные 50/50 через криптографический генератор. */
function rollOutcome(): Outcome {
  const [n] = crypto.getRandomValues(new Uint8Array(1));
  return n < 128 ? 'yes' : 'no';
}

const reel = createReel(byId('strip'), { reduceMotion, onTick: haptic.tick });

let busy = false;
let hintTimer: ReturnType<typeof setTimeout> | undefined;

const lever = createLever(byId('lever'), byId('leverBall'), {
  reduceMotion,
  canPull: () => !busy,
  onPull: () => void spin(),
});

async function spin() {
  if (busy) return;
  busy = true;
  clearTimeout(hintTimer);
  lever.setHint(false);
  setState('spinning');
  statusEl.textContent = MESSAGES.spinning;
  haptic.pull();

  const outcome = rollOutcome();
  await reel.spin(outcome);

  const won = outcome === 'yes';
  setState(won ? 'win' : 'lose');
  statusEl.textContent = MESSAGES[outcome];
  haptic.result(won);
  if (won && !reduceMotion) burstCoins(fx, reelWindow);

  busy = false;
  hintTimer = setTimeout(() => lever.setHint(true), 2500);
}

statusEl.textContent = MESSAGES.idle;
document.fonts.ready.then(() => layoutBulbs(bulbs));
addEventListener('resize', () => layoutBulbs(bulbs));
