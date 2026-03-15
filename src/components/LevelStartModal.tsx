import React from 'react';
import { motion } from 'framer-motion';
import { Play, Shield, Sparkles, Trash2, X, Zap } from 'lucide-react';
import type { Language } from '../i18n';
import { COPY } from '../i18n';

type LevelStartModalProps = {
  level: number;
  goalPreview: React.ReactNode;
  pacePreview: string;
  language: Language;
  runModifiers: Array<{
    id: string;
    title: string;
    description: string;
    cost: number;
    active: boolean;
  }>;
  coinsBalance: number;
  onBuyRunModifier: (modifierId: string) => void;
  bossShieldCharges?: number;
  onPlay: () => void;
  onClose: () => void;
};

export const LevelStartModal: React.FC<LevelStartModalProps> = ({ level, goalPreview, pacePreview, language, runModifiers, coinsBalance, onBuyRunModifier, bossShieldCharges = 0, onPlay, onClose }) => {
  const t = COPY[language];
  const title = language === 'ru' ? 'Подготовка к запуску' : 'Prepare for Launch';
  const subtitle = language === 'ru' ? 'Проверь цель и начни уровень' : 'Check your goal and start the level';
  const playLabel = language === 'ru' ? 'Играть' : 'Play';
  const runModifiersTitle = language === 'ru' ? 'Усилители забега' : 'Run modifiers';
  const runModifiersSubtitle = language === 'ru' ? 'Одноразовые покупки перед стартом уровня' : 'One-time boosts before the level starts';

  const getModifierVisuals = (modifierId: string) => {
    if (modifierId === 'startBomb') {
      return {
        icon: <Sparkles className="h-4 w-4" />,
        badge: language === 'ru' ? 'Сильный старт' : 'Fast opener',
        tone: 'from-amber-300/35 to-orange-500/20 border-amber-200/25 text-amber-50',
      };
    }
    if (modifierId === 'startLightning') {
      return {
        icon: <Zap className="h-4 w-4" />,
        badge: language === 'ru' ? 'Линия сразу' : 'Line clear',
        tone: 'from-cyan-300/35 to-sky-500/20 border-cyan-200/25 text-cyan-50',
      };
    }
    if (modifierId === 'bossShield') {
      return {
        icon: <Shield className="h-4 w-4" />,
        badge: language === 'ru' ? 'Против босса' : 'Boss safe',
        tone: 'from-emerald-300/35 to-teal-500/20 border-emerald-200/25 text-emerald-50',
      };
    }
    return {
      icon: <Trash2 className="h-4 w-4" />,
      badge: language === 'ru' ? 'Чистое поле' : 'Board cleanup',
      tone: 'from-violet-300/35 to-fuchsia-500/20 border-violet-200/25 text-violet-50',
    };
  };

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
          <div className="mt-3 text-lg font-black leading-tight text-white">
            {goalPreview}
          </div>
          <div className="mt-3 rounded-2xl border border-cyan-200/20 bg-cyan-300/8 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/80">
            {pacePreview}
          </div>
        </div>

        {runModifiers.length > 0 && (
          <div className="mt-4 rounded-2xl border border-amber-200/15 bg-amber-300/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] uppercase tracking-[0.22em] text-amber-100/80">
                {runModifiersTitle}
              </div>
              <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-black text-amber-50">
                {language === 'ru' ? 'Монеты' : 'Coins'}: {coinsBalance}
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-amber-50/80">
              <Sparkles className="h-3.5 w-3.5 text-amber-200" />
              <span>{runModifiersSubtitle}</span>
            </div>
            <div className="mt-3 space-y-2">
              {runModifiers.map((modifier) => {
                const visuals = getModifierVisuals(modifier.id);
                return (
                <div key={modifier.id} className={`rounded-xl border bg-gradient-to-r p-3 ${visuals.tone}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-black/20">
                          {visuals.icon}
                        </span>
                        <div>
                          <div className="text-sm font-black text-white">{modifier.title}</div>
                          <div className="mt-1 inline-flex rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/80">
                            {visuals.badge}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-slate-100/88">{modifier.description}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onBuyRunModifier(modifier.id)}
                      disabled={modifier.active}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${
                        modifier.active
                          ? 'bg-emerald-300/20 text-emerald-100'
                          : 'bg-gradient-to-r from-amber-300 to-orange-400 text-slate-900 shadow-[0_0_16px_rgba(251,191,36,0.28)]'
                      }`}
                    >
                      {modifier.active
                        ? (language === 'ru' ? 'Готово' : 'Armed')
                        : (language === 'ru' ? `-${modifier.cost} мон.` : `-${modifier.cost}`)}
                    </button>
                  </div>
                </div>
              )})}
            </div>
            {bossShieldCharges > 0 && (
              <div className="mt-3 text-xs font-bold text-emerald-100">
                {language === 'ru' ? `Щит уже заряжен для этого матча: ${bossShieldCharges}` : `Shield is already charged for this run: ${bossShieldCharges}`}
              </div>
            )}
          </div>
        )}

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



