import { motion } from 'framer-motion';
import { Coins, X } from 'lucide-react';
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-md rounded-3xl border border-cyan-100/35 bg-slate-950/90 p-5 text-white shadow-[0_20px_60px_rgba(8,47,73,0.55)]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95"
          aria-label={language === 'ru' ? 'Закрыть магазин' : 'Close shop'}
        >
          <X size={18} />
        </button>

        <div className="mb-4 flex items-center justify-between rounded-2xl border border-cyan-300/35 bg-cyan-500/10 px-3 py-2">
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-200">{t.coins}</span>
          <span className="inline-flex items-center gap-2 text-lg font-black text-cyan-100">
            <Coins size={18} />
            {coinsBalance}
          </span>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/75">{language === 'ru' ? 'Бустеры за монеты' : 'Boosters for coins'}</div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {!isTimeMode && (
                <button
                  onClick={onBuyMoves}
                  className="rounded-xl border border-cyan-200/45 bg-cyan-400/20 px-3 py-2 text-left text-sm font-semibold transition-all hover:bg-cyan-400/30 active:scale-[0.98]"
                >
                  <div>{t.buyExtraMoves}</div>
                  <div className="text-xs text-cyan-100/90">+{moveBoostAmount} • {boosterCost}</div>
                </button>
              )}
              {isTimeMode && (
                <button
                  onClick={onBuyTime}
                  className="rounded-xl border border-cyan-200/45 bg-cyan-400/20 px-3 py-2 text-left text-sm font-semibold transition-all hover:bg-cyan-400/30 active:scale-[0.98]"
                >
                  <div>{t.buyExtraTime}</div>
                  <div className="text-xs text-cyan-100/90">+{timeBoostSeconds}s • {boosterCost}</div>
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/75">{t.buyCoins}</div>
            <div className="space-y-2">
              {packs.map((pack) => (
                pack.url ? (
                  <a
                    key={pack.id}
                    href={pack.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl border border-emerald-200/35 bg-emerald-500/15 px-3 py-2 transition-all hover:bg-emerald-500/25"
                  >
                    <span className="text-sm font-semibold">{t.coinsAmount(pack.coins)}</span>
                    <span className="text-sm font-bold text-emerald-100">{pack.priceLabel} · {t.openPayment}</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    key={pack.id}
                    onClick={() => onBuyPack(pack.id)}
                    className="flex w-full items-center justify-between rounded-xl border border-emerald-200/35 bg-emerald-500/15 px-3 py-2 text-left transition-all hover:bg-emerald-500/25"
                  >
                    <span className="text-sm font-semibold">{t.coinsAmount(pack.coins)}</span>
                    <span className="text-xs font-bold text-emerald-100">
                      {`${pack.priceLabel} · ${t.openPayment}`}
                    </span>
                  </button>
                )
              ))}
            </div>
            <div className="mt-3 text-xs text-white/65">
              {language === 'ru' ? 'Онлайн-оплата временно отключена в игре' : 'In-game online payments are temporarily disabled'}
              <br />
              {language === 'ru' ? 'Позже можно подключить другой платежный провайдер.' : 'You can connect another payment provider later.'}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
