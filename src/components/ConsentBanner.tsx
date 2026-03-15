import type { Language } from '../i18n';

type ConsentBannerProps = {
  language: Language;
  isOpen: boolean;
  analytics: boolean;
  marketing: boolean;
  onAcceptAll: () => void;
  onSaveEssentialOnly: () => void;
  onToggleAnalytics: () => void;
  onToggleMarketing: () => void;
  onClose: () => void;
};

const legalLinks = {
  offer: '/LegalDocsPDF/01_Oferta.html',
  privacy: '/LegalDocsPDF/02_Privacy.html',
  refunds: '/LegalDocsPDF/03_Refunds.html',
};

export function ConsentBanner({
  language,
  isOpen,
  analytics,
  marketing,
  onAcceptAll,
  onSaveEssentialOnly,
  onToggleAnalytics,
  onToggleMarketing,
  onClose,
}: ConsentBannerProps) {
  if (!isOpen) return null;

  const isRu = language === 'ru';

  return (
    <div className="absolute inset-x-3 bottom-3 z-[120] sm:left-1/2 sm:w-[min(34rem,calc(100%-2rem))] sm:-translate-x-1/2">
      <div className="rounded-[1.7rem] border border-cyan-200/25 bg-slate-950/95 p-4 text-white shadow-[0_16px_44px_rgba(2,6,23,0.65)] backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/75">
              {isRu ? 'Приватность' : 'Privacy'}
            </div>
            <div className="mt-1 text-sm font-black text-white">
              {isRu ? 'Выберите, какие данные можно передавать внешним сервисам' : 'Choose which data can be sent to external services'}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/70 transition hover:bg-white/10"
          >
            {isRu ? 'Скрыть' : 'Hide'}
          </button>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-white/72">
          {isRu
            ? 'Необязательные трекеры, маркетинговые пиксели и внешние сервисы аналитики не запускаются, пока вы их не разрешите. Обязательные данные нужны только для работы игры, платежей и защиты от злоупотреблений.'
            : 'Optional trackers, marketing pixels, and external analytics services stay off until you allow them. Required data is used only to run the game, payments, and abuse protection.'}
        </p>

        <div className="mt-3 grid gap-2">
          <button
            type="button"
            onClick={onToggleAnalytics}
            className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-left transition ${
              analytics ? 'border-cyan-200/35 bg-cyan-300/12 text-cyan-50' : 'border-white/10 bg-white/5 text-white/78'
            }`}
          >
            <span>
              <span className="block text-xs font-black uppercase tracking-[0.16em]">
                {isRu ? 'Аналитика и ошибки' : 'Analytics and errors'}
              </span>
              <span className="mt-1 block text-[11px] text-white/70">
                {isRu ? 'GA / PostHog / Yandex / Sentry' : 'GA / PostHog / Yandex / Sentry'}
              </span>
            </span>
            <span className="text-[11px] font-black uppercase tracking-[0.14em]">
              {analytics ? (isRu ? 'Вкл' : 'On') : (isRu ? 'Выкл' : 'Off')}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleMarketing}
            className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-left transition ${
              marketing ? 'border-fuchsia-200/35 bg-fuchsia-300/12 text-fuchsia-50' : 'border-white/10 bg-white/5 text-white/78'
            }`}
          >
            <span>
              <span className="block text-xs font-black uppercase tracking-[0.16em]">
                {isRu ? 'Маркетинговые пиксели' : 'Marketing pixels'}
              </span>
              <span className="mt-1 block text-[11px] text-white/70">
                {isRu ? 'TikTok и рекламные теги' : 'TikTok and ad tags'}
              </span>
            </span>
            <span className="text-[11px] font-black uppercase tracking-[0.14em]">
              {marketing ? (isRu ? 'Вкл' : 'On') : (isRu ? 'Выкл' : 'Off')}
            </span>
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-cyan-100/80">
          <a href={legalLinks.privacy} target="_blank" rel="noopener noreferrer" className="rounded-full border border-cyan-200/15 bg-cyan-300/[0.06] px-2.5 py-1 hover:bg-cyan-300/[0.12]">
            {isRu ? 'Политика ПД' : 'Privacy policy'}
          </a>
          <a href={legalLinks.offer} target="_blank" rel="noopener noreferrer" className="rounded-full border border-cyan-200/15 bg-cyan-300/[0.06] px-2.5 py-1 hover:bg-cyan-300/[0.12]">
            {isRu ? 'Оферта' : 'Offer'}
          </a>
          <a href={legalLinks.refunds} target="_blank" rel="noopener noreferrer" className="rounded-full border border-cyan-200/15 bg-cyan-300/[0.06] px-2.5 py-1 hover:bg-cyan-300/[0.12]">
            {isRu ? 'Возвраты' : 'Refunds'}
          </a>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onSaveEssentialOnly}
            className="rounded-2xl border border-white/12 bg-white/6 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white/82 transition hover:bg-white/10"
          >
            {isRu ? 'Только обязательное' : 'Required only'}
          </button>
          <button
            type="button"
            onClick={onAcceptAll}
            className="rounded-2xl bg-gradient-to-r from-cyan-300 to-sky-400 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-950 transition hover:from-cyan-200 hover:to-sky-300"
          >
            {isRu ? 'Принять выбранное' : 'Save selection'}
          </button>
        </div>
      </div>
    </div>
  );
}
