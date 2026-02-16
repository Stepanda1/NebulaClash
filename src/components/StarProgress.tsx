import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { clsx } from 'clsx';
import type { Language } from '../i18n';
import { COPY } from '../i18n';

interface StarProgressProps {
    score: number;
    level: number;
    language: Language;
}

const STAR_THRESHOLDS = [700, 1400, 2200] as const;

export const StarProgress: React.FC<StarProgressProps> = ({ score, level, language }) => {
    const t = COPY[language];
    const progress = Math.min(100, (score / STAR_THRESHOLDS[2]) * 100);

    return (
        <div className="w-full max-w-xs flex flex-col items-center gap-1 relative z-20">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-1 rounded-full border-2 border-white/20 shadow-lg mb-1">
                <span className="text-white font-black text-sm uppercase tracking-widest drop-shadow-sm">{t.level(level)}</span>
            </div>

            <div className="w-full h-8 bg-black/30 rounded-full border-4 border-white/20 backdrop-blur-md relative overflow-hidden">
                <div className="absolute inset-0 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 shadow-[0_0_15px_rgba(234,179,8,0.6)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                    />
                </div>

                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 -translate-y-1/2" style={{ left: '33%' }}>
                        <div className="-translate-x-1/2">
                            <StarMarker active={score >= STAR_THRESHOLDS[0]} />
                        </div>
                    </div>

                    <div className="absolute top-1/2 -translate-y-1/2" style={{ left: '66%' }}>
                        <div className="-translate-x-1/2">
                            <StarMarker active={score >= STAR_THRESHOLDS[1]} />
                        </div>
                    </div>

                    <div className="absolute top-1/2 -translate-y-1/2" style={{ right: '4px' }}>
                        <StarMarker active={score >= STAR_THRESHOLDS[2]} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const StarMarker = ({ active }: { active: boolean }) => {
    return (
        <div className={clsx(
            'relative w-10 h-10 flex items-center justify-center transition-all duration-500',
            active ? 'scale-110' : 'scale-90 opacity-60 grayscale',
        )}>
            <Star
                size={20}
                className={clsx(
                    'drop-shadow-md transition-all duration-300 stroke-[3px]',
                    active ? 'fill-yellow-300 text-yellow-600' : 'fill-slate-800 text-slate-500',
                )}
            />
            {active && (
                <motion.div
                    layoutId="star-burst"
                    className="absolute inset-0 bg-yellow-400 rounded-full blur-md opacity-50"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                />
            )}
        </div>
    );
};
