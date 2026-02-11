import React from 'react';
import { motion } from 'framer-motion';

const STEPS = [
    'Swipe the highlighted gems to make a line of 3.',
    'Double tap the Bomb to activate it.',
    'Swipe the Lightning to activate it.',
];

export const TutorialHint: React.FC<{ step: number }> = ({ step }) => {
    return (
        <motion.div
            className="absolute inset-x-0 top-24 sm:top-24 z-40 flex justify-center pointer-events-none px-3"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
        >
            <div className="max-w-sm w-full rounded-2xl bg-black text-white text-sm sm:text-base px-4 py-3 border border-white/20 shadow-xl text-center">
                {STEPS[step]}
            </div>
        </motion.div>
    );
};
