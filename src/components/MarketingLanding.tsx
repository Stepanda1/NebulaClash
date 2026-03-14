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
  const heroTitle = language === 'ru' ? 'Матч-3 с боссами прямо в браузере' : 'Boss match-3 you can play in your browser';
  const heroBody = language === 'ru'
    ? 'Без установки. Первый уровень запускается сразу: быстрые комбо, спец-фигуры, щиты босса и магазин монет уже в первой сессии.'
    : 'No install. Jump into the first level right away: fast combos, special pieces, boss shields, and the coin shop all show up in the first session.';
  const proofBadges = language === 'ru'
    ? ['Без установки', 'Первый уровень за минуту', 'Монеты и бустеры сразу']
    : ['No install', 'First level in under a minute', 'Coins and boosters live'];
  const featureCards = language === 'ru'
    ? [
      { label: 'Первые секунды', value: 'Быстрый payoff' },
      { label: 'Спец-фигуры', value: 'Бомба + молния' },
      { label: 'Бои', value: 'Боссы и щиты' },
    ]
    : [
      { label: 'First seconds', value: 'Fast payoff' },
      { label: 'Special pieces', value: 'Bomb + lightning' },
      { label: 'Battles', value: 'Bosses and shields' },
    ];
  const secondaryProof = language === 'ru'
    ? ['Играй бесплатно на сайте', 'Покупки монет за пару тапов', 'Цель уровня видна с первого экрана']
    : ['Play free on the site', 'Coin purchases in a couple taps', 'Goal is readable from the first screen'];

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

      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-md flex-col justify-start gap-3 px-4 py-3 min-[700px]:justify-center min-[700px]:gap-4 min-[700px]:px-5 min-[700px]:py-6">
        <div className="relative mt-1 overflow-hidden rounded-[2rem] border border-cyan-200/20 bg-[linear-gradient(152deg,rgba(7,17,38,0.94)_0%,rgba(10,28,57,0.9)_30%,rgba(16,32,68,0.86)_58%,rgba(7,14,32,0.96)_100%)] p-3 shadow-[0_0_44px_rgba(34,211,238,0.16)] backdrop-blur-md min-[700px]:mt-4 min-[700px]:rounded-[2.2rem] min-[700px]:p-5">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan-300/12 blur-2xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-amber-300/10 blur-2xl" />
          <div className="pointer-events-none absolute right-6 top-6 h-20 w-20 rounded-full border border-cyan-100/18 bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.24)_0%,rgba(125,211,252,0.12)_34%,rgba(14,116,144,0.05)_60%,rgba(0,0,0,0)_72%)]" />
          <div className="pointer-events-none absolute left-5 top-5 text-[9px] font-black uppercase tracking-[0.24em] text-cyan-200/80 min-[700px]:left-6 min-[700px]:top-6 min-[700px]:text-[10px] min-[700px]:tracking-[0.28em]">
            Nebula Clash
          </div>

          <div className="relative mt-5 rounded-[1.7rem] border border-white/10 bg-[linear-gradient(160deg,rgba(2,6,23,0.4),rgba(15,23,42,0.28))] p-3 min-[700px]:mt-6 min-[700px]:rounded-3xl min-[700px]:p-5">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/70 min-[700px]:mb-3 min-[700px]:px-3 min-[700px]:text-[11px] min-[700px]:tracking-[0.16em]">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.9)]" />
              {language === 'ru' ? 'Играй сразу в браузере' : 'Play instantly in your browser'}
            </div>
            <div className="mb-2 flex items-center justify-center min-[700px]:mb-4">
              <div className="relative flex h-16 w-16 items-center justify-center min-[700px]:h-24 min-[700px]:w-24">
                <div className="absolute inset-0 rounded-full border border-cyan-200/20 bg-[radial-gradient(circle_at_50%_50%,rgba(125,211,252,0.12),rgba(0,0,0,0)_70%)]" />
                <div className="absolute inset-[8px] rounded-full border border-white/8 bg-slate-950/18" />
                <NebulaCoreIcon className="h-14 w-14 text-cyan-200 drop-shadow-[0_0_18px_rgba(34,211,238,0.22)] min-[700px]:h-20 min-[700px]:w-20" />
              </div>
            </div>
            <div className="max-w-[96%] text-[1.65rem] font-black leading-[1.05] text-white min-[700px]:max-w-[92%] min-[700px]:text-2xl sm:text-3xl">
              {heroTitle}
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-white/72 min-[700px]:mt-3 min-[700px]:text-sm">
              {heroBody}
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5 min-[700px]:mt-4 min-[700px]:gap-2">
              {proofBadges.map((badge) => (
                <div key={badge} className="rounded-full border border-cyan-200/18 bg-cyan-300/[0.08] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-cyan-100/90 min-[700px]:px-3 min-[700px]:py-1.5 min-[700px]:text-[10px] min-[700px]:tracking-[0.16em]">
                  {badge}
                </div>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center min-[700px]:mt-4">
              {featureCards.map((item) => (
                <div key={item.label} className="rounded-xl border border-cyan-200/12 bg-white/[0.03] px-2 py-2 min-[700px]:rounded-2xl">
                  <div className="text-[9px] uppercase tracking-[0.12em] text-white/45 min-[700px]:text-[10px] min-[700px]:tracking-[0.16em]">{item.label}</div>
                  <div className="mt-1 text-[13px] font-black leading-tight text-cyan-100 min-[700px]:text-sm">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-2 max-[699px]:hidden min-[700px]:mt-4">
              {secondaryProof.map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/72">
                  <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.9)]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 grid gap-2 min-[700px]:mt-4 min-[700px]:gap-3">
              <button
                type="button"
                onClick={() => {
                  trackEvent('landing_play_click', { entry: 'marketing_landing' });
                  onPlayNow();
                }}
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-[1.4rem] border border-cyan-100/30 bg-[linear-gradient(135deg,rgba(34,211,238,0.22)_0%,rgba(59,130,246,0.22)_46%,rgba(251,191,36,0.14)_100%)] px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-cyan-50 shadow-[0_0_26px_rgba(34,211,238,0.18)] transition-all hover:scale-[1.01] min-[700px]:gap-3 min-[700px]:rounded-3xl min-[700px]:px-5 min-[700px]:py-3.5 min-[700px]:tracking-[0.22em]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 min-[700px]:h-10 min-[700px]:w-10 min-[700px]:rounded-2xl">
                  <LaunchGlyph className="h-4.5 w-4.5 text-cyan-100 min-[700px]:h-5 min-[700px]:w-5" />
                </span>
                {language === 'ru' ? 'Запустить первый уровень' : 'Play the first level now'}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => openTrackedLink('landing_join_tg_click', marketingLinks.telegramUrl, 'telegram')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200/20 bg-sky-300/[0.08] px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-100 min-[700px]:py-3 min-[700px]:tracking-[0.16em]"
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
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200/20 bg-amber-300/[0.08] px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-amber-100 min-[700px]:py-3 min-[700px]:tracking-[0.16em]"
                >
                  <SignalGlyph className="h-4 w-4 text-amber-100" />
                  {language === 'ru' ? 'Отзыв' : 'Feedback'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-2 rounded-[1.4rem] border border-white/8 bg-slate-950/42 px-3 py-3 shadow-[0_0_24px_rgba(0,0,0,0.16)] backdrop-blur-md max-[699px]:hidden">
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
