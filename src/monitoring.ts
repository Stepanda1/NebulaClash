import * as Sentry from '@sentry/react';
import { trackEvent } from './analytics';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const SENTRY_ENVIRONMENT =
  (import.meta.env.VITE_SENTRY_ENVIRONMENT as string | undefined) ??
  (import.meta.env.MODE as string | undefined) ??
  'production';

const SENTRY_TRACES_SAMPLE_RATE = Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? '0.2');
const LONG_TASK_THRESHOLD_MS = Number(import.meta.env.VITE_LONG_TASK_THRESHOLD_MS ?? '200');
const LONG_TASK_MAX_PER_SESSION = Number(import.meta.env.VITE_LONG_TASK_MAX_PER_SESSION ?? '30');

let monitoringInitialized = false;

function initSentry() {
  if (!SENTRY_DSN) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    tracesSampleRate: Number.isFinite(SENTRY_TRACES_SAMPLE_RATE)
      ? SENTRY_TRACES_SAMPLE_RATE
      : 0.2,
  });
}

function initLagObserver() {
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return;

  const supportsLongTask = PerformanceObserver.supportedEntryTypes?.includes('longtask');
  if (!supportsLongTask) return;

  let longTaskCount = 0;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();

    for (const entry of entries) {
      if (entry.duration < LONG_TASK_THRESHOLD_MS) continue;
      if (longTaskCount >= LONG_TASK_MAX_PER_SESSION) return;

      longTaskCount += 1;

      const payload = {
        duration_ms: Math.round(entry.duration),
        start_time_ms: Math.round(entry.startTime),
        task_name: entry.name || 'longtask',
        task_count: longTaskCount,
      };

      trackEvent('long_task_detected', payload);
      Sentry.captureMessage('long_task_detected', {
        level: 'warning',
        extra: payload,
      });
    }
  });

  observer.observe({ entryTypes: ['longtask'] });
}

export function initMonitoring() {
  if (monitoringInitialized) return;

  initSentry();
  initLagObserver();

  monitoringInitialized = true;
}
