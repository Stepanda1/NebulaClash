import { useCallback, useEffect } from 'react';
import type { Language } from '../i18n';
import type { MarketingLinks } from '../config/appConfig';
import type { LegalContacts } from '../types/legal';
import { getAttributionPayload, trackEvent } from '../analytics';
import { CosmicBackdrop, LaunchGlyph, NebulaCoreIcon, SignalGlyph } from './CosmicArtwork';

type MarketingLandingProps = {
  language: Language;
  marketingLinks: MarketingLinks;
  contacts: LegalContacts;
  onPlayNow: () => void;
  onOpenFeedback: () => void;
};

export function MarketingLanding({
  language,
  marketingLinks,
  contacts,
  onPlayNow,
  onOpenFeedback,
}: MarketingLandingProps) {
  useEffect(() => {
    trackEvent('landing_view', { entry: 'marketing_landing' });
  }, []);

  const buildTrackedUrl = useCallback((targetUrl: string, medium: string) => {
    const url = new URL(targetUrl, typeof window !== 'undefined' ? window.location.origin : 'https://nebulaclash.com');
    const attribution = getAttributionPayload();

    Object.entries(attribution).forEach(([key, value]) => {
      if (value != null && !url.searchParams.has(key)) {
        url.searchParams.set(key, String(value));
      }
    });

    if (!url.searchParams.has('utm_medium')) {
      url.searchParams.set('utm_medium', medium);
    }
    if (!url.searchParams.has('utm_campaign')) {
      url.searchParams.set('utm_campaign', 'validation_landing');
    }
    if (!url.searchParams.has('utm_content')) {
      url.searchParams.set('utm_content', 'entry_screen');
    }

    return url.toString();
  }, []);

  const openTrackedLink = useCallback((eventName: string, targetUrl?: string, medium: string = 'social') => {
    if (!targetUrl) return;
    const trackedUrl = buildTrackedUrl(targetUrl, medium);
    trackEvent(eventName, { target_url: trackedUrl });
    window.open(trackedUrl, '_blank', 'noopener,noreferrer');
  }, [buildTrackedUrl]);

  const legalLinks = [
    { label: language === 'ru' ? 'Оферта' : 'Offer', href: '/LegalDocsPDF/01_Oferta.pdf' },
    { label: language === 'ru' ? 'Политика ПД' : 'Privacy Policy', href: '/LegalDocsPDF/02_Privacy.pdf' },
    { label: language === 'ru' ? 'Возврат' : 'Refunds', href: '/LegalDocsPDF/03_Refunds.pdf' },
    { label: language === 'ru' ? 'Реквизиты' : 'Requisites', href: '/LegalDocsPDF/04_Requisites.pdf' },
  ] as const;

  return (
    <div className="relative h-full w-full overflow-x-hidden overflow-y-auto bg-slate-950 text-white">
      <CosmicBackdrop variant="landing" />

      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-md flex-col justify-center gap-4 px-5 py-4 sm:py-6">
        <div className="relative mt-4 overflow-hidden rounded-[2.2rem] border border-cyan-200/20 bg-[linear-gradient(152deg,rgba(7,17,38,0.94)_0%,rgba(10,28,57,0.9)_30%,rgba(16,32,68,0.86)_58%,rgba(7,14,32,0.96)_100%)] p-4 sm:p-5 shadow-[0_0_44px_rgba(34,211,238,0.16)] backdrop-blur-md">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan-300/12 blur-2xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-amber-300/10 blur-2xl" />
          <div className="pointer-events-none absolute right-6 top-6 h-20 w-20 rounded-full border border-cyan-100/18 bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.24)_0%,rgba(125,211,252,0.12)_34%,rgba(14,116,144,0.05)_60%,rgba(0,0,0,0)_72%)]" />
          <div className="pointer-events-none absolute left-6 top-6 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200/80">
            Nebula Clash
          </div>

          <div className="relative mt-6 rounded-3xl border border-white/10 bg-[linear-gradient(160deg,rgba(2,6,23,0.4),rgba(15,23,42,0.28))] p-4 sm:p-5">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.9)]" />
              {language === 'ru' ? 'Матч-3 с боссами' : 'Boss Match-3'}
            </div>
            <div className="mb-4 flex items-center justify-center">
              <div className="relative flex h-24 w-24 items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-cyan-200/20 bg-[radial-gradient(circle_at_50%_50%,rgba(125,211,252,0.12),rgba(0,0,0,0)_70%)]" />
                <div className="absolute inset-[8px] rounded-full border border-white/8 bg-slate-950/18" />
                <NebulaCoreIcon className="h-20 w-20 text-cyan-200 drop-shadow-[0_0_18px_rgba(34,211,238,0.22)]" />
              </div>
            </div>
            <div className="max-w-[84%] text-2xl font-black leading-tight text-white sm:text-3xl">
              {language === 'ru' ? 'Играть' : 'Play Now'}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/72">
              {language === 'ru'
                ? 'Космический матч-3 с боссами, щитами и особыми фигурами. Запускайте уровень сразу и проверяйте, цепляет ли игра с первых секунд.'
                : 'A sci-fi match-3 with bosses, shields, and shape-based specials. Jump straight into the level flow and see if the game hooks on first contact.'}
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl border border-cyan-200/12 bg-white/[0.03] px-2 py-2">
                <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">{language === 'ru' ? 'Формы' : 'Shapes'}</div>
                <div className="mt-1 text-sm font-black text-cyan-100">{language === 'ru' ? 'Нова' : 'Nova'}</div>
              </div>
              <div className="rounded-2xl border border-cyan-200/12 bg-white/[0.03] px-2 py-2">
                <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">{language === 'ru' ? 'Бои' : 'Bosses'}</div>
                <div className="mt-1 text-sm font-black text-cyan-100">60</div>
              </div>
              <div className="rounded-2xl border border-cyan-200/12 bg-white/[0.03] px-2 py-2">
                <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">{language === 'ru' ? 'Стиль' : 'Mode'}</div>
                <div className="mt-1 text-sm font-black text-cyan-100">{language === 'ru' ? 'Космос' : 'Sci-Fi'}</div>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <button
                type="button"
                onClick={() => {
                  trackEvent('landing_play_click', { entry: 'marketing_landing' });
                  onPlayNow();
                }}
                className="inline-flex w-full items-center justify-center gap-3 rounded-3xl border border-cyan-100/30 bg-[linear-gradient(135deg,rgba(34,211,238,0.22)_0%,rgba(59,130,246,0.22)_46%,rgba(251,191,36,0.14)_100%)] px-5 py-3.5 text-sm font-black uppercase tracking-[0.22em] text-cyan-50 shadow-[0_0_26px_rgba(34,211,238,0.18)] transition-all hover:scale-[1.01]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                  <LaunchGlyph className="h-5 w-5 text-cyan-100" />
                </span>
                {language === 'ru' ? 'Играть сейчас' : 'Play Now'}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => openTrackedLink('landing_join_tg_click', marketingLinks.telegramUrl, 'telegram')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200/20 bg-sky-300/[0.08] px-3 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100"
                >
                  <NebulaCoreIcon className="h-4 w-4 text-cyan-100" />
                  TG
                </button>
                <button
                  type="button"
                  onClick={() => {
                    trackEvent('landing_feedback_open', { entry: 'marketing_landing' });
                    onOpenFeedback();
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200/20 bg-amber-300/[0.08] px-3 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-amber-100"
                >
                  <SignalGlyph className="h-4 w-4 text-amber-100" />
                  {language === 'ru' ? 'Отзыв' : 'Feedback'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-2 rounded-[1.4rem] border border-white/8 bg-slate-950/42 px-3 py-3 shadow-[0_0_24px_rgba(0,0,0,0.16)] backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-[11px] leading-none text-white/62">
            <span>{language === 'ru' ? '99 / 199 / 499 ₽' : '99 / 199 / 499 RUB'}</span>
            <span className="text-white/28">•</span>
            <span>{language === 'ru' ? 'сразу после оплаты' : 'instant delivery'}</span>
            <span className="text-white/28">•</span>
            <a href={`mailto:${contacts.email}`} className="transition hover:text-white">{language === 'ru' ? 'Почта' : 'Email'}</a>
            <span className="text-white/28">•</span>
            <a href={contacts.tiktok} target="_blank" rel="noopener noreferrer" className="transition hover:text-white">TikTok</a>
            <span className="text-white/28">•</span>
            <a href={contacts.telegram} target="_blank" rel="noopener noreferrer" className="transition hover:text-white">{language === 'ru' ? 'Телеграм' : 'Telegram'}</a>
            <span className="text-white/28">•</span>
            <span>{contacts.sellerName}</span>
            <span className="text-white/28">•</span>
            <span>{language === 'ru' ? 'ИНН' : 'TIN'} {contacts.sellerInn}</span>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {legalLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-cyan-200/14 bg-cyan-300/[0.05] px-2.5 py-1 text-[10px] font-medium text-cyan-100/80 transition hover:bg-cyan-300/[0.1] hover:text-cyan-50"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
