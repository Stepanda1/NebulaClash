import React from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface PauseMenuProps {
    onResume: () => void;
    onRestart: () => void;
    isMuted: boolean;
    onToggleMute: () => void;
    volume: number; // 0..1
    onVolumeChange: (volume: number) => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({ onResume, onRestart, isMuted, onToggleMute, volume, onVolumeChange }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-xs rounded-[2rem] border-2 border-white/50 bg-white/20 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] p-8 flex flex-col gap-4 text-center"
            >
                <h2 className="text-3xl font-black text-white drop-shadow-lg mb-2 tracking-wide">PAUSED</h2>

                <button
                    onClick={onResume}
                    className="flex items-center justify-center gap-3 w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white rounded-xl font-bold text-lg shadow-lg border border-white/20 active:scale-95 transition-all"
                >
                    <Play size={24} className="fill-white" />
                    RESUME
                </button>

                <button
                    onClick={onRestart}
                    className="flex items-center justify-center gap-3 w-full py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold text-lg shadow-lg border border-white/20 active:scale-95 transition-all"
                >
                    <RotateCcw size={24} />
                    RESTART
                </button>

                <div className="w-full mt-2 p-3 rounded-xl bg-white/10 border border-white/20 shadow-inner">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-white/80 text-sm font-bold tracking-wide">SOUND</span>
                        <button
                            onClick={onToggleMute}
                            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white active:scale-95 transition-all"
                            aria-label={isMuted ? "Unmute" : "Mute"}
                        >
                            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round(volume * 100)}
                        onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
                        className="w-full accent-cyan-300"
                    />
                </div>
            </motion.div>
        </motion.div>
    );
};
