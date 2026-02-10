import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Trophy } from 'lucide-react';

interface GameOverMenuProps {
    score: number;
    onRestart: () => void;
}

export const GameOverMenu: React.FC<GameOverMenuProps> = ({ score, onRestart }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        >
            <motion.div
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-sm bg-gradient-to-b from-slate-800 to-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col gap-6 items-center text-center relative overflow-hidden"
            >
                {/* Background Glow */}
                <div className="absolute top-0 inset-x-0 h-32 bg-blue-500/20 blur-3xl rounded-full -translate-y-1/2 pointer-events-none"></div>

                <div className="space-y-1 relative z-10">
                    <h2 className="text-3xl font-black text-white uppercase tracking-wider drop-shadow-lg">Out of Moves!</h2>
                    <p className="text-slate-400 font-medium">Time to shuffle things up?</p>
                </div>

                <div className="flex flex-col items-center gap-2 py-4 relative z-10">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Final Score</span>
                    <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-amber-600 drop-shadow-sm filter">
                        {score.toLocaleString()}
                    </div>
                </div>

                <button
                    onClick={onRestart}
                    className="flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 active:scale-95 transition-all rounded-2xl shadow-xl shadow-blue-900/50 group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-2xl"></div>
                    <RotateCcw size={24} className="text-white relative z-10 group-hover:-rotate-180 transition-transform duration-500" />
                    <span className="text-xl font-bold text-white uppercase tracking-wider relative z-10">Try Again</span>
                </button>
            </motion.div>
        </motion.div>
    );
};
