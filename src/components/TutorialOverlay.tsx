import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TutorialOverlayProps {
    onFinish: () => void;
    onStepChange?: (step: number) => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onFinish, onStepChange }) => {
    const steps = useMemo(() => ([
        {
            title: 'Добро пожаловать!',
            text: 'Меняй соседние кристаллы местами, чтобы собрать 3 в ряд.',
        },
        {
            title: 'Бомба',
            text: 'Собери 4 в ряд — появится бомба. Нажми по ней, чтобы взорвать.',
        },
        {
            title: 'Молния',
            text: 'Собери 5 в ряд или букву T/L — появится молния.',
        },
        {
            title: 'Комбо',
            text: 'Если молния или бомба зацепит другую — они обе сработают.',
        },
    ]), []);

    const [step, setStep] = useState(0);
    const isLast = step === steps.length - 1;

    useEffect(() => {
        onStepChange?.(step);
    }, [step, onStepChange]);

    return (
        <AnimatePresence>
            <motion.div
                className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="w-full max-w-sm rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl p-6 text-center text-white shadow-2xl"
                    initial={{ scale: 0.9, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                    <div className="text-xs uppercase tracking-widest text-white/60 mb-2">
                        Подсказка {step + 1}/{steps.length}
                    </div>
                    <h3 className="text-2xl font-black mb-2">{steps[step].title}</h3>
                    <p className="text-white/80 text-sm leading-relaxed mb-5">{steps[step].text}</p>
                    <div className="flex gap-2">
                        <button
                            className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 font-semibold transition-all active:scale-95"
                            onClick={onFinish}
                        >
                            Пропустить
                        </button>
                        <button
                            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold transition-all active:scale-95"
                            onClick={() => {
                                if (isLast) onFinish();
                                else setStep(s => s + 1);
                            }}
                        >
                            {isLast ? 'Понятно' : 'Дальше'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
