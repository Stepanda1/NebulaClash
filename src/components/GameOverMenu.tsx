import { motion } from 'framer-motion';
import { Coins, RotateCcw, TimerReset, TriangleAlert } from 'lucide-react';
import type { Language } from '../i18n';
import { COPY } from '../i18n';

interface GameOverMenuProps {
    score: number;
    mode: 'moves' | 'time';
    boostCost: number;
    boostAmountLabel: string;
    canAffordContinue: boolean;
    onRestart: () => void;
    onBuyContinue: () => void;
    onOpenShop: () => void;
    language: Language;
}

export const GameOverMenu: React.FC<GameOverMenuProps> = ({ score, mode, boostCost, boostAmountLabel, canAffordContinue, onRestart, onBuyContinue, onOpenShop, language }) => {
    const t = COPY[language];
    const continueLabel = mode === 'moves'
      ? (language === 'ru' ? `Взять ${boostAmountLabel}` : `Get ${boostAmountLabel}`)
      : (language === 'ru' ? `Добавить ${boostAmountLabel}` : `Add ${boostAmountLabel}`);
    const continueHint = canAffordContinue
      ? (language === 'ru' ? 'Продолжить за монеты' : 'Continue for coins')
      : (language === 'ru' ? 'Не хватает монет, открой магазин' : 'Not enough coins, open the shop');

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[radial-gradient(circle_at_50%_20%,rgba(239,68,68,0.18),transparent_45%),radial-gradient(circle_at_20%_80%,rgba(168,85,247,0.14),transparent_50%),rgba(2,6,23,0.88)] p-3 pt-6 backdrop-blur-md sm:items-center sm:p-4"
        >
            <motion.div
                initial={{ scale: 0.86, y: 28, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                className="relative my-auto flex max-h-[min(88dvh,46rem)] w-full max-w-sm flex-col items-center gap-5 overflow-y-auto rounded-[2rem] border border-rose-200/15 bg-slate-950/80 p-5 text-center shadow-[0_18px_80px_rgba(0,0,0,0.6),0_0_70px_rgba(244,63,94,0.12)] sm:gap-6 sm:p-7"
            >
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-20 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-rose-500/20 blur-3xl" />
                    <div className="absolute right-[-30px] top-12 h-28 w-28 rounded-full bg-fuchsia-500/10 blur-2xl" />
                    <div className="absolute left-[-20px] bottom-10 h-24 w-24 rounded-full bg-cyan-400/10 blur-2xl" />
                    <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_20%_25%,rgba(255,255,255,0.5)_0_1px,transparent_1.5px),radial-gradient(circle_at_70%_60%,rgba(255,255,255,0.45)_0_1px,transparent_1.5px),radial-gradient(circle_at_40%_80%,rgba(255,255,255,0.35)_0_1px,transparent_1.5px)]" />
                </div>

                <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl border border-rose-200/20 bg-gradient-to-br from-rose-400/25 to-orange-400/10 shadow-[0_0_35px_rgba(244,63,94,0.2)]">
                    <div className="absolute inset-1 rounded-xl border border-white/10 bg-slate-950/50" />
                    <TriangleAlert size={34} className="relative text-rose-300 drop-shadow-[0_0_10px_rgba(253,164,175,0.45)]" />
                </div>

                <div className="space-y-1 relative z-10">
                    <div className="text-[11px] uppercase tracking-[0.28em] text-rose-200/70">
                        {language === 'ru' ? 'Сигнал тревоги' : 'Distress Signal'}
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-wider drop-shadow-lg">{t.outOfMoves}</h2>
                    <p className="text-slate-300/85 font-medium">{continueHint}</p>
                </div>

                <div className="relative z-10 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5 shadow-inner shadow-black/30">
                    <div className="mb-2 text-xs font-bold text-slate-300/70 uppercase tracking-[0.24em]">{t.finalScore}</div>
                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-200 via-yellow-300 to-orange-500 drop-shadow-sm">
                        {score.toLocaleString()}
                    </div>
                    <div className="mt-3 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                    <div className="mt-3 text-[11px] uppercase tracking-[0.22em] text-slate-400/80">
                        {language === 'ru' ? 'Перезапустить сектор' : 'Reboot Sector'}
                    </div>
                </div>

                <div className="relative z-10 w-full rounded-2xl border border-emerald-200/15 bg-emerald-400/10 px-4 py-4 text-left shadow-[0_12px_34px_rgba(16,185,129,0.12)]">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="text-[11px] uppercase tracking-[0.22em] text-emerald-100/75">
                                {language === 'ru' ? 'Последний шанс' : 'Last chance'}
                            </div>
                            <div className="mt-1 text-base font-black text-white">{continueLabel}</div>
                        </div>
                        <div className="rounded-full border border-emerald-200/20 bg-black/20 px-3 py-1 text-sm font-black text-emerald-100">
                            -{boostCost}
                        </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm text-emerald-50/80">
                        {mode === 'moves' ? <RotateCcw size={16} /> : <TimerReset size={16} />}
                        <span>{language === 'ru' ? 'Сразу вернёт тебя в матч' : 'Drops you straight back into the run'}</span>
                    </div>
                </div>

                <button
                    onClick={canAffordContinue ? onBuyContinue : onOpenShop}
                    className="flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-500 hover:from-emerald-300 hover:via-cyan-300 hover:to-sky-400 active:scale-[0.98] transition-all rounded-2xl shadow-[0_10px_30px_rgba(34,211,238,0.28)] border border-white/15 group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.24)_45%,transparent_65%)] translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700" />
                    <Coins size={24} className="text-white relative z-10" />
                    <span className="text-lg font-bold text-white uppercase tracking-[0.18em] relative z-10">
                        {canAffordContinue ? continueLabel : (language === 'ru' ? 'Купить монеты' : 'Get coins')}
                    </span>
                </button>

                <button
                    onClick={onRestart}
                    className="flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-r from-rose-500 via-fuchsia-500 to-violet-600 hover:from-rose-400 hover:via-fuchsia-400 hover:to-violet-500 active:scale-[0.98] transition-all rounded-2xl shadow-[0_10px_30px_rgba(168,85,247,0.32)] border border-white/15 group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.24)_45%,transparent_65%)] translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700" />
                    <RotateCcw size={24} className="text-white relative z-10 group-hover:-rotate-180 transition-transform duration-500" />
                    <span className="text-xl font-bold text-white uppercase tracking-wider relative z-10">{t.tryAgain}</span>
                </button>
            </motion.div>
        </motion.div>
    );
};
