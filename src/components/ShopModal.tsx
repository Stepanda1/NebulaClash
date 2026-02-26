import { motion } from 'framer-motion';
import { Coins, Gift, Rocket, Sparkles, Timer, X, Zap } from 'lucide-react';
import type { Language } from '../i18n';
import { COPY } from '../i18n';

export type ShopPack = {
  id: string;
  coins: number;
  priceLabel: string;
  url?: string;
};

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
  const paymentsHintLine1 = language === 'ru' ? 'Онлайн-оплата временно отключена в игре' : 'In-game online payments are temporarily disabled';
  const paymentsHintLine2 = language === 'ru' ? 'Позже можно подключить другой платежный провайдер.' : 'You can connect another payment provider later.';
  const maxPackCoins = Math.max(...packs.map((p) => p.coins), 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[80] flex items-center justify-center bg-[radial-gradient(circle_at_50%_8%,rgba(34,211,238,0.16),transparent_45%),radial-gradient(circle_at_80%_76%,rgba(168,85,247,0.14),transparent_52%),rgba(2,6,23,0.84)] backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-lg rounded-3xl border border-cyan-100/20 bg-slate-950/85 p-4 sm:p-5 text-white shadow-[0_20px_70px_rgba(0,0,0,0.55),0_0_60px_rgba(34,211,238,0.08)] overflow-hidden"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-cyan-400/16 blur-3xl" />
          <div className="absolute right-[-20px] top-16 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl" />
          <div className="absolute left-[-18px] bottom-14 h-24 w-24 rounded-full bg-amber-400/10 blur-2xl" />
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_16%_22%,rgba(255,255,255,0.5)_0_1px,transparent_1.5px),radial-gradient(circle_at_80%_36%,rgba(255,255,255,0.45)_0_1px,transparent_1.5px),radial-gradient(circle_at_45%_76%,rgba(255,255,255,0.4)_0_1px,transparent_1.5px)]" />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-rose-200/35 bg-gradient-to-br from-rose-500 to-red-600 text-white transition-all hover:from-rose-400 hover:to-red-500 active:scale-95 shadow-[0_8px_24px_rgba(239,68,68,0.35)]"
          aria-label={language === 'ru' ? 'Закрыть магазин' : 'Close shop'}
        >
          <X size={18} strokeWidth={3} />
        </button>

        <div className="relative z-10 mb-4 rounded-2xl border border-cyan-200/20 bg-white/[0.03] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-200/80">
                <Sparkles size={12} />
                {coinLabel}
              </div>
              <div className="mt-1 text-sm text-white/80">{t.buyCoins}</div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/35 bg-gradient-to-r from-amber-300/25 via-yellow-300/20 to-orange-300/25 px-3 py-1.5 shadow-[0_0_20px_rgba(251,191,36,0.16)]">
              <span className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#fde68a_0%,#fbbf24_42%,#f59e0b_72%,#d97706_100%)] shadow-[inset_0_1px_2px_rgba(255,255,255,0.45),inset_0_-2px_3px_rgba(146,64,14,0.35),0_2px_8px_rgba(251,146,60,0.35)]">
                <span className="absolute left-[5px] top-[4px] h-1.5 w-2.5 rounded-full bg-white/35 blur-[0.5px]" />
                <Coins size={13} className="relative text-amber-950/95" />
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
                      <Rocket size={16} className="text-cyan-200" />
                    </span>
                    <span className="text-sm font-bold leading-tight">{t.buyExtraMoves}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-cyan-100/90">+{moveBoostAmount}</span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/20 bg-amber-300/10 px-2 py-0.5 text-amber-100">
                      <Coins size={12} className="text-amber-300" />
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
                      <Timer size={16} className="text-violet-200" />
                    </span>
                    <span className="text-sm font-bold leading-tight">{t.buyExtraTime}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-violet-100/90">+{timeBoostSeconds}s</span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/20 bg-amber-300/10 px-2 py-0.5 text-amber-100">
                      <Coins size={12} className="text-amber-300" />
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
                        {featured ? <Gift size={16} className="text-fuchsia-200" /> : <Zap size={16} className="text-emerald-200" />}
                      </div>
                      {featured && (
                        <span className="rounded-full border border-fuchsia-200/25 bg-fuchsia-300/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-fuchsia-100">
                          {language === 'ru' ? 'Хит' : 'Best'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#fde68a_0%,#fbbf24_42%,#f59e0b_72%,#d97706_100%)] shadow-[inset_0_1px_2px_rgba(255,255,255,0.45),inset_0_-2px_3px_rgba(146,64,14,0.35),0_2px_8px_rgba(251,146,60,0.35)]">
                        <span className="absolute left-[6px] top-[5px] h-1.5 w-3 rounded-full bg-white/35 blur-[0.5px]" />
                        <Coins size={14} className="relative text-amber-950/95" />
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
