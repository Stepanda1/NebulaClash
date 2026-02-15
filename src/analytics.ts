export type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

type YmFunction = ((counterId: number, action: string, ...args: unknown[]) => void) & {
  a?: unknown[][];
  l?: number;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    ym?: YmFunction;
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
const YM_COUNTER_ID_RAW = import.meta.env.VITE_YM_COUNTER_ID as string | undefined;
const YM_COUNTER_ID = YM_COUNTER_ID_RAW ? Number(YM_COUNTER_ID_RAW) : NaN;

let initialized = false;
let sessionId: string | null = null;

const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined';

function injectScript(src: string, id: string) {
  if (!isBrowser()) return;
  if (document.getElementById(id)) return;

  const script = document.createElement('script');
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function initGA4() {
  if (!isBrowser() || !GA_MEASUREMENT_ID) return;

  injectScript(`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`, 'ga4-script');

  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = (...args: unknown[]) => {
      window.dataLayer?.push(args);
    };
  }

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    anonymize_ip: true,
    send_page_view: true,
  });
}

function initYandexMetrica() {
  if (!isBrowser() || !Number.isFinite(YM_COUNTER_ID)) return;

  if (!window.ym) {
    const ymStub: YmFunction = ((...args: unknown[]) => {
      ymStub.a = ymStub.a || [];
      ymStub.a.push(args);
    }) as YmFunction;
    ymStub.l = Date.now();
    window.ym = ymStub;
  }

  injectScript('https://mc.yandex.ru/metrika/tag.js', 'ym-script');

  window.ym(YM_COUNTER_ID, 'init', {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
  });
}

function createSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getSessionId() {
  if (sessionId) return sessionId;

  if (!isBrowser()) {
    sessionId = createSessionId();
    return sessionId;
  }

  const stored = window.sessionStorage.getItem('match3_session_id');
  if (stored) {
    sessionId = stored;
    return stored;
  }

  const nextSessionId = createSessionId();
  window.sessionStorage.setItem('match3_session_id', nextSessionId);
  sessionId = nextSessionId;
  return nextSessionId;
}

export function initAnalytics() {
  if (initialized) return;

  initGA4();
  initYandexMetrica();
  initialized = true;
}

export function trackEvent(eventName: string, payload: AnalyticsPayload = {}) {
  if (!isBrowser()) return;

  const withSession = {
    session_id: getSessionId(),
    ...payload,
  };

  if (GA_MEASUREMENT_ID && typeof window.gtag === 'function') {
    window.gtag('event', eventName, withSession);
  }

  if (Number.isFinite(YM_COUNTER_ID) && typeof window.ym === 'function') {
    window.ym(YM_COUNTER_ID, 'reachGoal', eventName, withSession);
  }
}
