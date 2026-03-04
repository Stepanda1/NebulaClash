import posthog from 'posthog-js';

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

const GA_MEASUREMENT_ID = ((import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined) || '').trim();
const YM_COUNTER_ID_RAW = ((import.meta.env.VITE_YM_COUNTER_ID as string | undefined) || '').trim();
const YM_COUNTER_ID = YM_COUNTER_ID_RAW ? Number(YM_COUNTER_ID_RAW) : NaN;
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://us.i.posthog.com';

let initialized = false;
let posthogInitialized = false;
let sessionId: string | null = null;
let attributionCache: AnalyticsPayload | null = null;
const UTM_STORAGE_KEY = 'match3_utm_attribution';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
const CORE_FUNNEL_NAME = 'core_conversion';

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

function initPostHog() {
  if (!isBrowser() || !POSTHOG_KEY || posthogInitialized) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
  });

  posthog.register({
    session_id: getSessionId(),
  });

  posthogInitialized = true;
}

function createSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readStoredAttribution(): AnalyticsPayload {
  if (!isBrowser()) return {};

  try {
    const raw = window.sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as AnalyticsPayload;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function getAttributionPayload(): AnalyticsPayload {
  if (attributionCache) return attributionCache;
  if (!isBrowser()) {
    attributionCache = {};
    return attributionCache;
  }

  const fromStorage = readStoredAttribution();
  const url = new URL(window.location.href);
  const fromUrl: AnalyticsPayload = {};

  UTM_KEYS.forEach((key) => {
    const value = url.searchParams.get(key);
    if (value) {
      fromUrl[key] = value;
    }
  });

  attributionCache = Object.keys(fromUrl).length > 0 ? { ...fromStorage, ...fromUrl } : fromStorage;

  try {
    window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(attributionCache));
  } catch {
    // Best-effort persistence only.
  }

  return attributionCache;
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

  getAttributionPayload();
  initGA4();
  initYandexMetrica();
  initPostHog();
  initialized = true;
}

function dispatchEvent(eventName: string, payload: AnalyticsPayload) {
  const withSession = {
    session_id: getSessionId(),
    ...getAttributionPayload(),
    ...payload,
  };

  if (GA_MEASUREMENT_ID && typeof window.gtag === 'function') {
    window.gtag('event', eventName, withSession);
  }

  if (Number.isFinite(YM_COUNTER_ID) && typeof window.ym === 'function') {
    window.ym(YM_COUNTER_ID, 'reachGoal', eventName, withSession);
  }

  if (posthogInitialized) {
    posthog.capture(eventName, withSession);
  }
}

function getFunnelStepPayload(eventName: string, payload: AnalyticsPayload): AnalyticsPayload | null {
  const level = typeof payload.level === 'number' ? payload.level : Number.NaN;

  if (eventName === 'landing_view') {
    return { funnel_name: CORE_FUNNEL_NAME, funnel_step: 'landing_view', funnel_index: 1 };
  }
  if (eventName === 'landing_play_click') {
    return { funnel_name: CORE_FUNNEL_NAME, funnel_step: 'landing_play_click', funnel_index: 2 };
  }
  if (eventName === 'session_start') {
    return { funnel_name: CORE_FUNNEL_NAME, funnel_step: 'session_start', funnel_index: 3 };
  }
  if (eventName === 'level_start' && level === 1) {
    return { funnel_name: CORE_FUNNEL_NAME, funnel_step: 'level_1_start', funnel_index: 4 };
  }
  if (eventName === 'level_complete' && level === 1) {
    return { funnel_name: CORE_FUNNEL_NAME, funnel_step: 'level_1_complete', funnel_index: 5 };
  }
  if (eventName === 'shop_open') {
    return { funnel_name: CORE_FUNNEL_NAME, funnel_step: 'shop_open', funnel_index: 6 };
  }
  if (eventName === 'checkout_start') {
    return { funnel_name: CORE_FUNNEL_NAME, funnel_step: 'checkout_start', funnel_index: 7 };
  }
  if (eventName === 'payment_credited') {
    return { funnel_name: CORE_FUNNEL_NAME, funnel_step: 'payment_credited', funnel_index: 8 };
  }

  return null;
}

export function trackEvent(eventName: string, payload: AnalyticsPayload = {}) {
  if (!isBrowser()) return;
  if (!initialized) {
    initAnalytics();
  }

  dispatchEvent(eventName, payload);

  if (eventName === 'funnel_step') return;

  const funnelPayload = getFunnelStepPayload(eventName, payload);
  if (funnelPayload) {
    dispatchEvent('funnel_step', {
      ...funnelPayload,
      source_event: eventName,
    });
  }
}
