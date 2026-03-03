import React from 'react';
import { motion } from 'framer-motion';
import type { Language } from '../i18n';
import { BoosterGlyph, CoinGlyph, CompassGlyph, NebulaCoreIcon, VaultGlyph } from './CosmicArtwork';

type TutorialHintProps = {
  step: number;
  totalSteps: number;
  onSkip: () => void;
  onAdvance: () => void;
  language: Language;
};

type TutorialStepContent = {
  badge: string;
  title: string;
  body: string;
  tips: string[];
  actionLabel: string;
  actionKind: 'advance' | 'finish' | 'wait';
};

function getStepContent(step: number, language: Language): TutorialStepContent {
  const isRu = language === 'ru';

  switch (step) {
    case 0:
      return {
        badge: isRu ? 'Быстрый старт' : 'Quick Start',
        title: isRu ? 'За 30 секунд поймёшь всю базу' : 'Learn the core loop in 30 seconds',
        body: isRu
          ? 'Сначала собери обычный матч. Затем попробуешь спец-фигуры, а в конце увидишь, где следить за целью, ходами и монетами.'
          : 'Start with a basic match, then try special pieces, and finish with a quick overview of goals, moves, and coins.',
        tips: isRu
          ? ['Сверху: цель уровня и прогресс', 'Слева вверху: пауза и настройки', 'Справа: магазин и бустеры']
          : ['Top: level goal and progress', 'Top left: pause and settings', 'Right side: shop and boosters'],
        actionLabel: isRu ? 'Начать обучение' : 'Start Tutorial',
        actionKind: 'advance',
      };
    case 1:
      return {
        badge: isRu ? 'Шаг 1' : 'Step 1',
        title: isRu ? 'Собери первый матч' : 'Make your first match',
        body: isRu
          ? 'Следуй подсветке на поле и передвинь фишку, чтобы собрать обычный матч-3. Это главный базовый ход.'
          : 'Follow the board highlight and move the piece to create a standard match-3. This is the main core action.',
        tips: isRu
          ? ['Можно тапнуть соседнюю фишку', 'Или провести свайп в нужную сторону']
          : ['Tap an adjacent piece', 'Or swipe in the shown direction'],
        actionLabel: isRu ? 'Сделай матч' : 'Make the Match',
        actionKind: 'wait',
      };
    case 2:
      return {
        badge: isRu ? 'Шаг 2' : 'Step 2',
        title: isRu ? 'Активируй бомбу' : 'Trigger the bomb',
        body: isRu
          ? 'После первого матча на поле появится бомба. Дважды нажми на неё, чтобы взорвать зону и быстро расчистить поле.'
          : 'A bomb appears after your first move. Double tap it to blast an area and clear the board fast.',
        tips: isRu
          ? ['Бомбы хороши против плотных участков', 'Их стоит беречь под сложные цели']
          : ['Bombs are best against dense areas', 'Save them for harder goals'],
        actionLabel: isRu ? 'Двойной тап по бомбе' : 'Double Tap the Bomb',
        actionKind: 'wait',
      };
    case 3:
      return {
        badge: isRu ? 'Шаг 3' : 'Step 3',
        title: isRu ? 'Проведи молнию' : 'Use the lightning',
        body: isRu
          ? 'Теперь на поле появится молния. Свайпни её с соседней фишкой, чтобы очистить целый ряд или колонку.'
          : 'Now a lightning piece appears. Swap it with a nearby tile to clear a full row or column.',
        tips: isRu
          ? ['Это лучший быстрый клир', 'Используй на нужной линии к цели']
          : ['This is your fast lane clear', 'Use it on lines that push your goal'],
        actionLabel: isRu ? 'Сдвинь молнию' : 'Swap the Lightning',
        actionKind: 'wait',
      };
    default:
      return {
        badge: isRu ? 'Финал' : 'Finish',
        title: isRu ? 'Теперь ты знаешь весь базовый цикл' : 'Now you know the full core loop',
        body: isRu
          ? 'Следи за целью сверху, за ходами снизу, открывай магазин справа для пополнения монет и бустеров. Всё остальное строится на этих действиях.'
          : 'Track the goal at the top, moves at the bottom, and open the shop on the right for coins and boosters. Everything else builds on this loop.',
        tips: isRu
          ? ['Цель уровня важнее лишних ходов', 'Спец-фигуры ускоряют прохождение', 'Монеты тратятся на экстренные бустеры']
          : ['The goal matters more than random moves', 'Special pieces speed up levels', 'Coins power emergency boosters'],
        actionLabel: isRu ? 'В игру' : 'Enter Game',
        actionKind: 'finish',
      };
  }
}

export const TutorialHint: React.FC<TutorialHintProps> = ({ step, totalSteps, onSkip, onAdvance, language }) => {
  const content = getStepContent(step, language);
  const progress = Math.max(1, Math.min(totalSteps, step + 1));
  const showAdvance = content.actionKind !== 'wait';
  const isActionStep = content.actionKind === 'wait';

  return (
    <motion.div
      className="absolute inset-x-0 top-16 z-40 flex justify-center px-3 sm:top-20"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
    >
      <div className="pointer-events-none w-full max-w-md">
        <div className="pointer-events-none mx-2 mb-2 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
        <div className="pointer-events-auto overflow-hidden rounded-[1.7rem] border border-cyan-100/18 bg-[linear-gradient(155deg,rgba(2,6,23,0.9)_0%,rgba(10,25,47,0.92)_42%,rgba(8,16,34,0.95)_100%)] p-4 text-white shadow-[0_18px_50px_rgba(0,0,0,0.5),0_0_32px_rgba(34,211,238,0.12)] backdrop-blur-md">
          <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(120deg,transparent_0%,rgba(148,163,184,0.05)_35%,rgba(255,255,255,0.02)_50%,transparent_100%)]" />
          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/80">
                  <NebulaCoreIcon className="h-3.5 w-3.5 text-cyan-100" />
                  {content.badge}
                </div>
                <div className="mt-3 text-lg font-black leading-tight sm:text-xl">{content.title}</div>
                <div className="mt-2 text-sm leading-relaxed text-white/74">{content.body}</div>
              </div>
              <div className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/60">
                <span>{progress}</span>
                <span>/</span>
                <span>{totalSteps}</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-2 text-center">
                <CoinGlyph className="mx-auto h-4.5 w-4.5" />
                <div className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/55">
                  {language === 'ru' ? 'Монеты' : 'Coins'}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-2 text-center">
                <BoosterGlyph className="mx-auto h-4.5 w-4.5 text-cyan-100" />
                <div className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/55">
                  {language === 'ru' ? 'Спец' : 'Specials'}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-2 text-center">
                <VaultGlyph className="mx-auto h-4.5 w-4.5 text-amber-100" />
                <div className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/55">
                  {language === 'ru' ? 'Магазин' : 'Shop'}
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              {content.tips.map((tip) => (
                <div key={tip} className="inline-flex w-full items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.025] px-3 py-2 text-xs text-white/72">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-xl border border-cyan-200/16 bg-cyan-300/8">
                    <CompassGlyph className="h-3.5 w-3.5 text-cyan-100/85" />
                  </span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onSkip}
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/[0.04] px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white/72 transition-colors hover:bg-white/[0.08] active:scale-95"
              >
                {language === 'ru' ? 'Пропустить' : 'Skip'}
              </button>

              {showAdvance ? (
                <button
                  type="button"
                  onClick={onAdvance}
                  className="inline-flex items-center justify-center rounded-full border border-cyan-100/24 bg-[linear-gradient(135deg,rgba(34,211,238,0.22),rgba(59,130,246,0.2),rgba(251,191,36,0.16))] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-50 shadow-[0_0_18px_rgba(34,211,238,0.12)] transition-transform hover:scale-[1.02] active:scale-95"
                >
                  {content.actionLabel}
                </button>
              ) : (
                <div className="rounded-full border border-amber-200/18 bg-amber-300/[0.06] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-amber-100/80">
                  {content.actionLabel}
                </div>
              )}
            </div>

            {isActionStep && (
              <div className="mt-3 text-center text-[11px] font-semibold text-cyan-100/70">
                {language === 'ru' ? 'Поле уже подсвечивает нужный ход' : 'The board is already highlighting the right move'}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
