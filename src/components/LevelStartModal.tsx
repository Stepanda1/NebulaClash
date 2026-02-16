import React from 'react';
import { motion } from 'framer-motion';
import { Play, X } from 'lucide-react';
import type { Language } from '../i18n';
import { COPY } from '../i18n';

type LevelStartModalProps = {
  level: number;
  language: Language;
  onPlay: () => void;
  onClose: () => void;
};

export const LevelStartModal: React.FC<LevelStartModalProps> = ({ level, language, onPlay, onClose }) => {
  const t = COPY[language];
  const title = language === 'ru' ? 'Подготовка к запуску' : 'Prepare for Launch';
  const subtitle = language === 'ru' ? 'Проверь цель и начни уровень' : 'Check your goal and start the level';
  const playLabel = language === 'ru' ? 'Играть' : 'Play';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-sm rounded-[2rem] border border-white/30 bg-slate-950/75 p-6 shadow-[0_20px_60px_rgba(6,182,212,0.25)]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 h-10 w-10 rounded-full border-4 border-white bg-red-500/90 text-white hover:bg-red-500 active:scale-95 transition-all flex items-center justify-center"
          aria-label={language === 'ru' ? 'Закрыть' : 'Close'}
        >
          <X size={18} strokeWidth={4} />
        </button>

        <div className="mb-4">
          <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/80">{title}</div>
          <h3 className="mt-2 text-3xl font-black text-white">{t.level(level)}</h3>
          <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-center">
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">{t.goal}</div>
          <div className="mt-2 text-sm text-white/85">
            {language === 'ru' ? 'Нажмите Play, чтобы начать.' : 'Press Play to start.'}
          </div>
        </div>

        <button
          type="button"
          onClick={onPlay}
          className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-black uppercase tracking-wide text-slate-900 bg-gradient-to-r from-cyan-300 to-sky-500 shadow-[0_0_24px_rgba(56,189,248,0.45)] hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Play size={18} className="fill-slate-900" />
          {playLabel}
        </button>
      </motion.div>
    </motion.div>
  );
};



