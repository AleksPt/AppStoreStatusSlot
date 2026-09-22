// Минимальная типизация Telegram WebApp: только то, что использует игра.
// Скрипт telegram-web-app.js подключён в index.html; вне Telegram объекта нет, всё работает без него.
interface HapticFeedback {
  impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
  notificationOccurred(type: 'error' | 'success' | 'warning'): void;
  selectionChanged(): void;
}

interface TelegramWebApp {
  ready(): void;
  expand(): void;
  disableVerticalSwipes?(): void;
  setHeaderColor?(color: string): void;
  setBackgroundColor?(color: string): void;
  HapticFeedback?: HapticFeedback;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

const webApp = window.Telegram?.WebApp;

export function initTelegram(): void {
  webApp?.ready();
  webApp?.expand();
  webApp?.disableVerticalSwipes?.(); // иначе рывок ручки вниз сворачивает Mini App
  webApp?.setHeaderColor?.('#1a0710');
  webApp?.setBackgroundColor?.('#070204');
}

export const haptic = {
  pull: () => webApp?.HapticFeedback?.impactOccurred('heavy'),
  tick: () => webApp?.HapticFeedback?.selectionChanged(),
  result: (success: boolean) => webApp?.HapticFeedback?.notificationOccurred(success ? 'success' : 'error'),
};
