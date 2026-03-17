import React from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, Share2, Volume2, VolumeX, X, Sparkles, PauseCircle } from 'lucide-react';
import type { Language } from '../i18n';
import type { LegalSection } from '../types/legal';
import { COPY } from '../i18n';

interface PauseMenuProps {
    onResume: () => void;
    onRestart: () => void;
    onClose: () => void;
    onOpenLegal: (section: LegalSection) => void;
    onOpenGuide: () => void;
    onShareGame: () => void;
    isMuted: boolean;
    onToggleMute: () => void;
    volume: number;
    onVolumeChange: (volume: number) => void;
    language: Language;
    onLanguageChange: (language: Language) => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({ onResume, onRestart, onClose, onOpenLegal, onOpenGuide, onShareGame, isMuted, onToggleMute, volume, onVolumeChange, language, onLanguageChange }) => {
    const t = COPY[language];
    const tx = (ru: string, en: string, zh: string) => {
        if (language === 'ru') return ru;
        if (language === 'zh') return zh;
        return en;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[radial-gradient(circle_at_50%_15%,rgba(34,211,238,0.14),transparent_45%),radial-gradient(circle_at_78%_72%,rgba(168,85,247,0.14),transparent_50%),rgba(2,6,23,0.78)] p-3 pt-6 backdrop-blur-sm sm:items-center sm:p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 16 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 240, damping: 20 }}
                className="relative my-auto flex max-h-[min(88dvh,46rem)] w-full max-w-sm flex-col gap-4 overflow-y-auto rounded-[2rem] border border-cyan-200/20 bg-slate-950/80 p-5 text-center shadow-[0_20px_80px_rgba(0,0,0,0.55),0_0_60px_rgba(34,211,238,0.08)] backdrop-blur-xl sm:p-6"
            >
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-cyan-400/15 blur-3xl" />
                    <div className="absolute right-[-24px] top-10 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl" />
                    <div className="absolute left-[-18px] bottom-12 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl" />
                    <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_15%_22%,rgba(255,255,255,0.55)_0_1px,transparent_1.6px),radial-gradient(circle_at_82%_34%,rgba(255,255,255,0.45)_0_1px,transparent_1.6px),radial-gradient(circle_at_47%_78%,rgba(255,255,255,0.35)_0_1px,transparent_1.6px)]" />
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-3 top-3 z-10 h-10 w-10 rounded-full border border-white/25 bg-rose-500/85 text-white hover:bg-rose-400 active:scale-95 transition-all flex items-center justify-center shadow-[0_6px_20px_rgba(244,63,94,0.28)]"
                    aria-label={tx('Закрыть настройки', 'Close settings', '关闭设置')}
                >
                    <X size={18} strokeWidth={3} />
                </button>

                <div className="relative z-10 mx-auto mt-1 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-200/20 bg-gradient-to-br from-cyan-400/20 to-blue-500/10 shadow-[0_0_28px_rgba(34,211,238,0.16)]">
                    <div className="absolute inset-1 rounded-xl border border-white/10 bg-slate-950/55" />
                    <PauseCircle size={28} className="relative text-cyan-200 drop-shadow-[0_0_10px_rgba(103,232,249,0.35)]" />
                </div>

                <div className="relative z-10 mb-1">
                    <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-cyan-200/75">
                        <Sparkles size={12} />
                        {tx('Навигационный модуль', 'Navigation Module', '导航模块')}
                    </div>
                    <h2 className="mt-1 text-2xl sm:text-3xl font-black text-white drop-shadow-lg tracking-wide">{t.paused}</h2>
                </div>

                <button
                    onClick={onResume}
                    className="relative z-10 flex items-center justify-center gap-2 w-full min-h-12 px-3 py-3 bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 hover:from-cyan-400 hover:via-sky-400 hover:to-indigo-400 text-white rounded-2xl font-black text-sm sm:text-base shadow-[0_10px_30px_rgba(14,165,233,0.25)] border border-white/15 active:scale-[0.98] transition-all overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.18)_45%,transparent_65%)] translate-x-[-120%] hover:translate-x-[120%] transition-transform duration-700" />
                    <Play size={20} className="fill-white relative z-10 shrink-0" />
                    <span className="relative z-10 break-words leading-tight text-center">{t.resume}</span>
                </button>

                <button
                    onClick={onRestart}
                    className="relative z-10 flex items-center justify-center gap-2 w-full min-h-12 px-3 py-3 bg-white/10 hover:bg-white/15 text-white rounded-2xl font-black text-sm sm:text-base shadow-lg border border-white/15 active:scale-[0.98] transition-all"
                >
                    <RotateCcw size={19} className="shrink-0" />
                    <span className="break-words leading-tight text-center">{t.restart}</span>
                </button>

                <div className="relative z-10 w-full mt-1 p-3 rounded-2xl bg-white/[0.04] border border-white/10 shadow-inner shadow-black/20">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-white/80 text-sm font-bold tracking-wide">{t.sound}</span>
                        <button
                            onClick={onToggleMute}
                            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white active:scale-95 transition-all"
                            aria-label={isMuted ? t.unmute : t.mute}
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

                <div className="relative z-10 w-full p-3 rounded-2xl bg-white/[0.04] border border-white/10 shadow-inner shadow-black/20">
                    <div className="text-left text-white/80 text-sm font-bold tracking-wide mb-2">{t.language}</div>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => onLanguageChange('ru')}
                            className={`flex items-center justify-center gap-2 rounded-xl py-2 border text-sm font-black tracking-wide transition-all active:scale-95 ${language === 'ru' ? 'bg-cyan-300 text-slate-900 border-cyan-200 shadow' : 'bg-white/10 border-white/15 text-white/80 hover:bg-white/20'}`}
                            aria-label="Russian language"
                        >
                            <span aria-hidden="true">RU</span>
                        </button>
                        <button
                            onClick={() => onLanguageChange('en')}
                            className={`flex items-center justify-center gap-2 rounded-xl py-2 border text-sm font-black tracking-wide transition-all active:scale-95 ${language === 'en' ? 'bg-cyan-300 text-slate-900 border-cyan-200 shadow' : 'bg-white/10 border-white/15 text-white/80 hover:bg-white/20'}`}
                            aria-label="English language"
                        >
                            <span aria-hidden="true">EN</span>
                        </button>
                        <button
                            onClick={() => onLanguageChange('zh')}
                            className={`flex items-center justify-center gap-2 rounded-xl py-2 border text-sm font-black tracking-wide transition-all active:scale-95 ${language === 'zh' ? 'bg-cyan-300 text-slate-900 border-cyan-200 shadow' : 'bg-white/10 border-white/15 text-white/80 hover:bg-white/20'}`}
                            aria-label="Chinese language"
                        >
                            <span aria-hidden="true">中文</span>
                        </button>
                    </div>
                </div>

                <div className="relative z-10 w-full p-3 rounded-2xl bg-white/[0.04] border border-white/10 shadow-inner shadow-black/20">
                    <div className="text-left text-white/80 text-sm font-bold tracking-wide mb-2">{t.legal}</div>
                    <div className="grid grid-cols-1 gap-2">
                        <button
                            onClick={onShareGame}
                            className="inline-flex items-center justify-center gap-2 rounded-xl px-2 py-2 border bg-fuchsia-300/12 border-fuchsia-200/30 text-fuchsia-100 hover:bg-fuchsia-300/22 transition-all active:scale-95 text-xs sm:text-sm font-semibold leading-tight break-words"
                        >
                            <Share2 size={14} />
                            {tx('Поделиться игрой', 'Share game', '分享游戏')}
                        </button>
                        <button
                            onClick={onOpenGuide}
                            className="rounded-xl px-2 py-2 border bg-cyan-300/15 border-cyan-200/25 text-cyan-100 hover:bg-cyan-300/25 transition-all active:scale-95 text-xs sm:text-sm font-semibold leading-tight break-words"
                        >
                            {tx('Руководство', 'Guide', '指南')}
                        </button>
                        <button
                            onClick={() => onOpenLegal('contacts')}
                            className="rounded-xl px-2 py-2 border bg-white/10 border-white/15 text-white/85 hover:bg-white/20 transition-all active:scale-95 text-xs sm:text-sm font-semibold leading-tight break-words"
                        >
                            {t.contacts}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};


