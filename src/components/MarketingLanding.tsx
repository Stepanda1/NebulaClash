import { useCallback } from 'react';
import { MessageSquareText, Play, Sparkles } from 'lucide-react';
import type { Language } from '../i18n';
import type { MarketingLinks } from '../config/appConfig';
import type { LegalContacts } from '../types/legal';
import { getAttributionPayload, trackEvent } from '../analytics';

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
    <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(130%_140%_at_18%_14%,#421a86_0%,#1a1046_34%,#09051c_70%,#03010c_100%)] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.72)_1px,transparent_1px),radial-gradient(circle_at_74%_28%,rgba(125,211,252,0.58)_1px,transparent_1px),radial-gradient(circle_at_65%_72%,rgba(196,181,253,0.52)_1px,transparent_1px)] [background-size:170px_170px,240px_240px,300px_300px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_34%,rgba(217,70,239,0.18),transparent_34%),radial-gradient(circle_at_78%_74%,rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_60%_16%,rgba(251,191,36,0.1),transparent_26%)]" />
      <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-fuchsia-500/18 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-16 h-72 w-72 rounded-full bg-cyan-400/14 blur-3xl" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-md flex-col justify-center px-5 py-6">
        <div className="relative overflow-hidden rounded-[2.2rem] border border-cyan-200/20 bg-[linear-gradient(145deg,rgba(8,14,34,0.92)_0%,rgba(14,23,52,0.86)_38%,rgba(21,15,56,0.82)_72%,rgba(6,10,28,0.94)_100%)] p-5 shadow-[0_0_44px_rgba(34,211,238,0.14)] backdrop-blur-md">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan-300/10 blur-2xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-fuchsia-400/10 blur-2xl" />
          <div className="pointer-events-none absolute right-6 top-6 h-20 w-20 rounded-full border border-cyan-100/20 bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.28)_0%,rgba(125,211,252,0.12)_34%,rgba(14,116,144,0.05)_60%,rgba(0,0,0,0)_72%)]" />
          <div className="pointer-events-none absolute left-6 top-6 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200/80">
            {language === 'ru' ? 'Nebula Clash' : 'Nebula Clash'}
          </div>

          <div className="relative mt-7 rounded-3xl border border-white/10 bg-black/18 p-5">
            <div className="max-w-[84%] text-3xl font-black leading-tight text-white">
              {language === 'ru' ? 'Play Now' : 'Play Now'}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/72">
              {language === 'ru'
                ? 'Космический match-3 с боссами, щитами и особыми формами. Запускайте уровень сразу и проверяйте, цепляет ли игра с первых секунд.'
                : 'A sci-fi match-3 with bosses, shields, and shape-based specials. Jump straight into the level flow and see if the game hooks on first contact.'}
            </p>

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={() => {
                  trackEvent('landing_play_click', { entry: 'marketing_landing' });
                  onPlayNow();
                }}
                className="inline-flex w-full items-center justify-center gap-3 rounded-3xl border border-cyan-100/30 bg-[linear-gradient(135deg,rgba(34,211,238,0.28)_0%,rgba(59,130,246,0.24)_46%,rgba(16,185,129,0.2)_100%)] px-5 py-4 text-sm font-black uppercase tracking-[0.22em] text-cyan-50 shadow-[0_0_26px_rgba(34,211,238,0.18)] transition-all hover:scale-[1.01]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                  <Play className="ml-0.5 h-5 w-5" />
                </span>
                {language === 'ru' ? 'Играть сейчас' : 'Play Now'}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => openTrackedLink('landing_join_tg_click', marketingLinks.telegramUrl, 'telegram')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200/20 bg-sky-300/[0.08] px-3 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100"
                >
                  <Sparkles className="h-4 w-4" />
                  TG
                </button>
                <button
                  type="button"
                  onClick={() => {
                    trackEvent('landing_feedback_open', { entry: 'marketing_landing' });
                    onOpenFeedback();
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-fuchsia-200/20 bg-fuchsia-300/[0.08] px-3 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-fuchsia-100"
                >
                  <MessageSquareText className="h-4 w-4" />
                  {language === 'ru' ? 'Отзыв' : 'Feedback'}
                </button>
              </div>
            </div>
          </div>

          <div className="relative mt-4 rounded-3xl border border-white/10 bg-black/18 p-4">
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200/80">
              {language === 'ru' ? 'Товары и услуги' : 'Goods and Services'}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-white/75">
              {language === 'ru'
                ? 'В игре доступны пакеты внутриигровой валюты (космические монеты) для покупки бустеров и ускорения прогресса. После подтверждения оплаты монеты начисляются автоматически.'
                : 'The game offers packs of in-game currency (space coins) used for boosters and progression. Coins are credited automatically after payment confirmation.'}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl border border-emerald-200/20 bg-emerald-300/[0.08] px-2 py-3">
                <div className="text-xs font-black text-white">120</div>
                <div className="mt-1 text-[11px] text-white/70">{language === 'ru' ? 'монет' : 'coins'}</div>
                <div className="mt-1 text-xs font-bold text-emerald-100">99 ₽</div>
              </div>
              <div className="rounded-2xl border border-cyan-200/20 bg-cyan-300/[0.08] px-2 py-3">
                <div className="text-xs font-black text-white">300</div>
                <div className="mt-1 text-[11px] text-white/70">{language === 'ru' ? 'монет' : 'coins'}</div>
                <div className="mt-1 text-xs font-bold text-cyan-100">199 ₽</div>
              </div>
              <div className="rounded-2xl border border-fuchsia-200/20 bg-fuchsia-300/[0.08] px-2 py-3">
                <div className="text-xs font-black text-white">800</div>
                <div className="mt-1 text-[11px] text-white/70">{language === 'ru' ? 'монет' : 'coins'}</div>
                <div className="mt-1 text-xs font-bold text-fuchsia-100">499 ₽</div>
              </div>
            </div>
          </div>

          <div className="relative mt-4 rounded-3xl border border-white/10 bg-black/18 p-4">
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200/80">
              {language === 'ru' ? 'Контакты и документы' : 'Contacts and Legal'}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-white/80">
              <a href={`mailto:${contacts.email}`} className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 hover:bg-white/[0.08]">
                Email: {contacts.email}
              </a>
              <a href={`tel:${contacts.phone}`} className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 hover:bg-white/[0.08]">
                {language === 'ru' ? 'Телефон' : 'Phone'}: {contacts.phone}
              </a>
              <a href={contacts.telegram} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 hover:bg-white/[0.08]">
                Telegram: {contacts.telegram}
              </a>
            </div>
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-xs leading-relaxed text-white/75">
              <div>{language === 'ru' ? 'Самозанятый' : 'Self-employed'}: {contacts.sellerName}</div>
              <div>{language === 'ru' ? 'ИНН' : 'TIN'}: {contacts.sellerInn}</div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {legalLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border border-cyan-200/20 bg-cyan-300/[0.08] px-3 py-2 text-center text-[11px] font-bold text-cyan-100 hover:bg-cyan-300/[0.12]"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
