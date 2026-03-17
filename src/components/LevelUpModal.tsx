import { motion } from 'framer-motion';
import { TrendingUp, ArrowRight, Star, Sparkles } from 'lucide-react';
import type { Language } from '../i18n';
import { COPY } from '../i18n';

interface LevelUpModalProps {
    level: number;
    score: number;
    starsEarned: number;
    onNextLevel: () => void;
    language: Language;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ level, score, starsEarned, onNextLevel, language }) => {
    const t = COPY[language];
    const tx = (ru: string, en: string, zh: string) => language === 'ru' ? ru : language === 'zh' ? zh : en;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[radial-gradient(circle_at_50%_15%,rgba(34,211,238,0.16),transparent_48%),radial-gradient(circle_at_75%_75%,rgba(168,85,247,0.14),transparent_52%),rgba(2,6,23,0.72)] p-3 pt-6 backdrop-blur-sm sm:items-center sm:p-4"
        >
            <motion.div
                initial={{ scale: 0.72, y: 34, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="relative my-auto flex max-h-[min(88dvh,44rem)] w-full max-w-sm flex-col items-center gap-5 overflow-y-auto rounded-[2rem] border border-cyan-200/20 bg-slate-950/75 p-5 text-center shadow-[0_20px_80px_rgba(0,0,0,0.55),0_0_60px_rgba(34,211,238,0.12)] backdrop-blur-xl sm:gap-6 sm:p-7"
            >
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-16 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-cyan-400/18 blur-3xl" />
                    <div className="absolute right-[-30px] top-12 h-28 w-28 rounded-full bg-violet-500/12 blur-2xl" />
                    <div className="absolute left-[-16px] bottom-10 h-24 w-24 rounded-full bg-emerald-400/10 blur-2xl" />
                    <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.55)_0_1px,transparent_1.5px),radial-gradient(circle_at_78%_36%,rgba(255,255,255,0.45)_0_1px,transparent_1.5px),radial-gradient(circle_at_42%_74%,rgba(255,255,255,0.4)_0_1px,transparent_1.5px)]" />
                </div>

                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative z-10"
                >
                    <div className="absolute inset-0 bg-cyan-400 blur-2xl opacity-35" />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-cyan-200/25 bg-gradient-to-br from-cyan-400/20 to-blue-500/10 shadow-[0_0_34px_rgba(34,211,238,0.22)]">
                        <div className="absolute inset-1 rounded-xl border border-white/10 bg-slate-950/55" />
                        <TrendingUp size={34} className="relative text-cyan-200 drop-shadow-[0_0_12px_rgba(103,232,249,0.45)]" />
                        <Sparkles size={15} className="absolute right-3 top-3 text-amber-200/90" />
                    </div>
                </motion.div>

                <div className="space-y-1 relative z-10">
                    <div className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">
                        {tx('Сектор очищен', 'Sector Cleared', '区域已清除')}
                    </div>
                    <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-100 via-white to-violet-200 drop-shadow-lg" style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))' }}>
                        {t.levelUp}
                    </h2>
                    <p className="text-white/90 font-bold text-lg tracking-wide drop-shadow-md">{t.stageComplete(level)}</p>
                </div>

                <div className="relative z-10 flex w-full flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5 shadow-inner shadow-black/30">
                    <div className="flex gap-2">
                        {[1, 2, 3].map((n, i) => (
                            <motion.div
                                key={n}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3 + i * 0.1, type: 'spring' }}
                            >
                                <Star
                                    size={24}
                                    className={n <= starsEarned ? 'fill-amber-300 text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.45)]' : 'fill-slate-700/40 text-slate-500'}
                                />
                            </motion.div>
                        ))}
                    </div>
                    <span className="text-xs font-bold text-white/60 uppercase tracking-[0.24em]">{t.scoreBonus}</span>
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-blue-300 drop-shadow-md font-mono">
                        {score.toLocaleString()}
                    </div>
                </div>

                <button
                    onClick={onNextLevel}
                    className="relative z-10 flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 hover:from-cyan-400 hover:via-sky-400 hover:to-indigo-400 active:scale-[0.98] transition-all rounded-2xl shadow-[0_10px_30px_rgba(14,165,233,0.28)] border border-white/15 group overflow-hidden text-white"
                >
                    <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.2)_45%,transparent_65%)] translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700" />
                    <span className="text-xl font-bold uppercase tracking-wider drop-shadow-md relative z-10">{t.nextLevel}</span>
                    <ArrowRight size={24} className="relative z-10 group-hover:translate-x-1 transition-transform drop-shadow-md" />
                </button>
            </motion.div>
        </motion.div>
    );
};
