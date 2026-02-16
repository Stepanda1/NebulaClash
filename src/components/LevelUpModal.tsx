import { motion } from 'framer-motion';
import { TrendingUp, ArrowRight, Star } from 'lucide-react';
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

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        >
            <motion.div
                initial={{ scale: 0.5, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-full max-w-sm rounded-[2rem] border-2 border-white/50 bg-white/20 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] p-8 flex flex-col gap-6 items-center text-center relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative"
                >
                    <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-50" />
                    <div className="relative bg-gradient-to-br from-blue-400 to-indigo-600 p-4 rounded-2xl shadow-lg border border-white/30 transform rotate-3">
                        <TrendingUp size={48} className="text-white drop-shadow-md" />
                    </div>
                </motion.div>

                <div className="space-y-1 relative z-10">
                    <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-blue-100 drop-shadow-lg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                        {t.levelUp}
                    </h2>
                    <p className="text-white font-bold text-lg tracking-wide drop-shadow-md opacity-90">{t.stageComplete(level)}</p>
                </div>

                <div className="flex flex-col items-center gap-2 p-4 w-full bg-black/20 rounded-xl border border-white/10 shadow-inner">
                    <div className="flex gap-2 mb-1">
                        {[1, 2, 3].map((n, i) => (
                            <motion.div
                                key={n}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3 + i * 0.1, type: 'spring' }}
                            >
                                <Star
                                    size={24}
                                    className={n <= starsEarned ? 'fill-yellow-400 text-yellow-500 drop-shadow-md' : 'fill-slate-700/40 text-slate-500'}
                                />
                            </motion.div>
                        ))}
                    </div>
                    <span className="text-xs font-bold text-white/60 uppercase tracking-widest">{t.scoreBonus}</span>
                    <div className="text-4xl font-black text-white drop-shadow-md font-mono">
                        {score.toLocaleString()}
                    </div>
                </div>

                <button
                    onClick={onNextLevel}
                    className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 active:scale-95 transition-all rounded-xl shadow-lg border border-white/30 group relative overflow-hidden text-white"
                >
                    <span className="text-xl font-bold uppercase tracking-wider drop-shadow-md">{t.nextLevel}</span>
                    <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform drop-shadow-md" />
                </button>
            </motion.div>
        </motion.div>
    );
};
