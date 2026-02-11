import React from 'react';
import { motion } from 'framer-motion';

const STEPS = [
    'Свайпни подсвеченные кристаллы, чтобы собрать 3 в ряд.',
    'Собери 4 в ряд — появится бомба.',
    'Собери 5 в ряд или форму T/L — появится молния.',
];

export const TutorialHint: React.FC<{ step: number }> = ({ step }) => {
    return (
        <motion.div
            className="absolute inset-x-0 top-16 sm:top-20 z-40 flex justify-center pointer-events-none px-3"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
        >
            <div className="max-w-sm w-full rounded-2xl bg-black/70 text-white text-sm sm:text-base px-4 py-3 border border-white/20 shadow-xl text-center">
                {STEPS[step]}
            </div>
        </motion.div>
    );
};
