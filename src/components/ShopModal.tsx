import { motion } from 'framer-motion';
import type { Language } from '../i18n';
import type { ShopPack } from '../types/shop';
import { COPY } from '../i18n';
import { BoosterGlyph, CloseGlyph, CoinGlyph, CosmicBackdrop, GiftGlyph, NebulaCoreIcon, TimeGlyph, VaultGlyph } from './CosmicArtwork';

type ShopModalProps = {
  language: Language;
  isTimeMode: boolean;
  coinsBalance: number;
  boosterCost: number;
  moveBoostAmount: number;
  timeBoostSeconds: number;
  packs: ShopPack[];
  onClose: () => void;
  onBuyMoves: () => void;
  onBuyTime: () => void;
  onBuyPack: (packId: string) => void;
};

export function ShopModal({
  language,
  isTimeMode,
  coinsBalance,
  boosterCost,
  moveBoostAmount,
  timeBoostSeconds,
  packs,
  onClose,
  onBuyMoves,
  onBuyTime,
  onBuyPack,
}: ShopModalProps) {
  const t = COPY[language];
  const coinLabel = language === 'ru' ? 'Космический магазин' : 'Space Shop';
  const boostersLabel = language === 'ru' ? 'Бустеры за монеты' : 'Boosters for coins';
  const paymentsHintLine1 = language === 'ru' ? 'Оплата проходит на защищенной странице провайдера' : 'Payments are processed on a secure provider page';
  const paymentsHintLine2 = language === 'ru' ? 'После подтверждения монеты начисляются автоматически.' : 'Coins are credited automatically after payment confirmation.';
  const maxPackCoins = Math.max(...packs.map((p) => p.coins), 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[80] flex items-center justify-center bg-slate-950/72 backdrop-blur-sm p-4"
    >
      <CosmicBackdrop variant="shop" className="opacity-95" />
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-cyan-100/20 bg-[linear-gradient(155deg,rgba(2,6,23,0.9)_0%,rgba(8,20,43,0.92)_34%,rgba(8,17,38,0.94)_100%)] p-4 text-white shadow-[0_20px_70px_rgba(0,0,0,0.55),0_0_60px_rgba(34,211,238,0.08)] sm:p-5"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-cyan-400/16 blur-3xl" />
          <div className="absolute right-[-20px] top-16 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl" />
          <div className="absolute left-[-18px] bottom-14 h-24 w-24 rounded-full bg-amber-400/10 blur-2xl" />
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(120deg,transparent_0%,rgba(148,163,184,0.04)_32%,rgba(255,255,255,0.02)_50%,transparent_100%)]" />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-rose-200/35 bg-gradient-to-br from-rose-500 to-red-600 text-white transition-all hover:from-rose-400 hover:to-red-500 active:scale-95 shadow-[0_8px_24px_rgba(239,68,68,0.35)]"
          aria-label={language === 'ru' ? 'Закрыть магазин' : 'Close shop'}
        >
          <CloseGlyph className="h-4.5 w-4.5 text-white" />
        </button>

        <div className="relative z-10 mb-4 rounded-2xl border border-cyan-200/20 bg-white/[0.03] p-3">
          <div className="flex items-start justify-between gap-3 pr-12">
            <div>
              <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-200/80">
                <NebulaCoreIcon className="h-3.5 w-3.5 text-cyan-100" />
                {coinLabel}
              </div>
              <div className="mt-1 text-sm text-white/80">{t.buyCoins}</div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/35 bg-gradient-to-r from-amber-300/25 via-yellow-300/20 to-orange-300/25 px-3 py-1.5 shadow-[0_0_20px_rgba(251,191,36,0.16)]">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                <CoinGlyph className="h-4 w-4" />
              </span>
              <span className="text-lg font-black text-amber-100">{coinsBalance}</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/75">{boostersLabel}</div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {!isTimeMode && (
                <button
                  onClick={onBuyMoves}
                  className="group rounded-2xl border border-cyan-200/25 bg-gradient-to-br from-cyan-400/14 to-blue-500/10 px-3 py-3 text-left transition-all hover:from-cyan-400/22 hover:to-blue-500/16 active:scale-[0.98]"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-200/25 bg-cyan-300/15">
                      <BoosterGlyph className="h-4 w-4 text-cyan-200" />
                    </span>
                    <span className="text-sm font-bold leading-tight">{t.buyExtraMoves}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-cyan-100/90">+{moveBoostAmount}</span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/20 bg-amber-300/10 px-2 py-0.5 text-amber-100">
                      <CoinGlyph className="h-3 w-3" />
                      {boosterCost}
                    </span>
                  </div>
                </button>
              )}
              {isTimeMode && (
                <button
                  onClick={onBuyTime}
                  className="group rounded-2xl border border-violet-200/20 bg-gradient-to-br from-violet-400/14 to-indigo-500/10 px-3 py-3 text-left transition-all hover:from-violet-400/22 hover:to-indigo-500/16 active:scale-[0.98]"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-violet-200/20 bg-violet-300/10">
                      <TimeGlyph className="h-4 w-4 text-violet-200" />
                    </span>
                    <span className="text-sm font-bold leading-tight">{t.buyExtraTime}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-violet-100/90">+{timeBoostSeconds}s</span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/20 bg-amber-300/10 px-2 py-0.5 text-amber-100">
                      <CoinGlyph className="h-3 w-3" />
                      {boosterCost}
                    </span>
                  </div>
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/75">{t.buyCoins}</div>
            <div className="grid grid-cols-2 gap-2">
              {packs.map((pack) => {
                const featured = pack.coins === maxPackCoins;
                const cardClass = featured
                  ? 'col-span-2 border-fuchsia-200/30 bg-gradient-to-br from-fuchsia-400/14 via-violet-500/12 to-cyan-400/10 hover:from-fuchsia-400/20 hover:via-violet-500/16 hover:to-cyan-400/14'
                  : 'border-emerald-200/20 bg-gradient-to-br from-emerald-400/12 to-teal-500/10 hover:from-emerald-400/18 hover:to-teal-500/14';
                const content = (
                  <>
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-white/5">
                        {featured ? <GiftGlyph className="h-4 w-4 text-fuchsia-200" /> : <VaultGlyph className="h-4 w-4 text-emerald-200" />}
                      </div>
                      {featured && (
                        <span className="rounded-full border border-fuchsia-200/25 bg-fuchsia-300/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-fuchsia-100">
                          {language === 'ru' ? 'Хит' : 'Best'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/8">
                        <CoinGlyph className="h-4.5 w-4.5" />
                      </span>
                      <span className="text-sm font-black text-white">{t.coinsAmount(pack.coins)}</span>
                    </div>
                    <div className="mt-2 text-xs font-semibold text-white/80 break-words leading-tight">{pack.priceLabel}</div>
                    <div className={`mt-2 text-[11px] font-black uppercase tracking-[0.16em] ${featured ? 'text-fuchsia-100/90' : 'text-emerald-100/85'}`}>
                      {t.openPayment}
                    </div>
                  </>
                );

                if (pack.url) {
                  return (
                    <a
                      key={pack.id}
                      href={pack.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`rounded-2xl border p-3 transition-all active:scale-[0.98] ${cardClass}`}
                    >
                      {content}
                    </a>
                  );
                }

                return (
                  <button
                    type="button"
                    key={pack.id}
                    onClick={() => onBuyPack(pack.id)}
                    className={`rounded-2xl border p-3 text-left transition-all active:scale-[0.98] ${cardClass}`}
                  >
                    {content}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/65 leading-relaxed">
              {paymentsHintLine1}
              <br />
              {paymentsHintLine2}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
