import React from 'react';
import { motion } from 'framer-motion';
import type { Language } from '../i18n';
import { BoosterGlyph, CoinGlyph, CompassGlyph, NebulaCoreIcon, VaultGlyph } from './CosmicArtwork';

type TutorialHintProps = {
  step: number;
  totalSteps: number;
  displayStep: number;
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
  const tx = (ru: string, en: string, zh: string) => language === 'ru' ? ru : language === 'zh' ? zh : en;

  switch (step) {
    case 0:
      return {
        badge: tx('Быстрый старт', 'Quick Start', '快速开始'),
        title: tx('За 30 секунд поймёшь всю базу', 'Learn the core loop in 30 seconds', '30 秒掌握核心玩法'),
        body: tx(
          'Сначала собери обычный матч. Затем попробуешь спец-фигуры, а в конце увидишь, где следить за целью, ходами и монетами.',
          'Start with a basic match, then try special pieces, and finish with a quick overview of goals, moves, and coins.',
          '先完成一次普通匹配，再尝试特殊棋子，最后快速了解目标、步数和金币的位置。',
        ),
        tips: language === 'ru'
          ? ['Сверху: цель уровня и прогресс', 'Слева вверху: пауза и настройки', 'Справа: магазин и бустеры']
          : language === 'zh'
            ? ['顶部：关卡目标与进度', '左上：暂停和设置', '右侧：商店与增益']
            : ['Top: level goal and progress', 'Top left: pause and settings', 'Right side: shop and boosters'],
        actionLabel: tx('Начать обучение', 'Start Tutorial', '开始教程'),
        actionKind: 'advance',
      };
    case 1:
      return {
        badge: tx('Шаг 1', 'Step 1', '步骤 1'),
        title: tx('Собери первый матч', 'Make your first match', '完成第一次匹配'),
        body: tx(
          'Сейчас окно закроется, и поле подсветит нужный ход. Передвинь фишку и собери обычный матч-3.',
          'The window will close and the board will highlight the move. Slide the piece to make a standard match-3.',
          '窗口关闭后，棋盘会高亮正确操作。移动棋子，完成一次标准 3 连。',
        ),
        tips: language === 'ru'
          ? ['Можно тапнуть соседнюю фишку', 'Или провести свайп в нужную сторону']
          : language === 'zh'
            ? ['可以点击相邻棋子', '也可以按提示方向滑动']
            : ['Tap an adjacent piece', 'Or swipe in the shown direction'],
        actionLabel: tx('Далее', 'Next', '下一步'),
        actionKind: 'advance',
      };
    case 3:
      return {
        badge: tx('Шаг 2', 'Step 2', '步骤 2'),
        title: tx('Активируй бомбу', 'Trigger the bomb', '触发炸弹'),
        body: tx(
          'После нажатия окно исчезнет. На поле останется бомба: дважды нажми на неё, чтобы взорвать участок.',
          'After you continue, the window closes. A bomb will stay on the board: double tap it to blast the area.',
          '继续后窗口会关闭，棋盘上会保留一个炸弹。双击它即可炸掉周围区域。',
        ),
        tips: language === 'ru'
          ? ['Бомбы хороши против плотных участков', 'Их стоит беречь под сложные цели']
          : language === 'zh'
            ? ['炸弹适合清理密集区域', '最好留给更难的目标']
            : ['Bombs are best against dense areas', 'Save them for harder goals'],
        actionLabel: tx('Далее', 'Next', '下一步'),
        actionKind: 'advance',
      };
    case 5:
      return {
        badge: tx('Шаг 3', 'Step 3', '步骤 3'),
        title: tx('Проведи молнию', 'Use the lightning', '使用闪电'),
        body: tx(
          'После нажатия окно закроется, и тебе останется сдвинуть молнию с соседней фишкой. Это очищает целую линию.',
          'After you continue, close the window and swap the lightning with a nearby tile. It clears a full line.',
          '继续后窗口关闭，再把闪电和旁边棋子交换，它会清除整条线。',
        ),
        tips: language === 'ru'
          ? ['Это лучший быстрый клир', 'Используй на нужной линии к цели']
          : language === 'zh'
            ? ['这是最快的清线手段', '用在能推进目标的行或列上']
            : ['This is your fast lane clear', 'Use it on lines that push your goal'],
        actionLabel: tx('Далее', 'Next', '下一步'),
        actionKind: 'advance',
      };
    default:
      return {
        badge: tx('Финал', 'Finish', '完成'),
        title: tx('Теперь ты знаешь весь базовый цикл', 'Now you know the full core loop', '现在你已经了解了核心循环'),
        body: tx(
          'Следи за целью сверху, за ходами снизу, открывай магазин справа для пополнения монет и бустеров. Всё остальное строится на этих действиях.',
          'Track the goal at the top, moves at the bottom, and open the shop on the right for coins and boosters. Everything else builds on this loop.',
          '关注顶部目标、底部步数，并在右侧打开商店补充金币和增益。其余系统都围绕这个循环展开。',
        ),
        tips: language === 'ru'
          ? ['Цель уровня важнее лишних ходов', 'Спец-фигуры ускоряют прохождение', 'Монеты тратятся на экстренные бустеры']
          : language === 'zh'
            ? ['优先完成关卡目标，而不是随便走步', '特殊棋子能显著加快通关', '金币用于紧急增益']
            : ['The goal matters more than random moves', 'Special pieces speed up levels', 'Coins power emergency boosters'],
        actionLabel: tx('В игру', 'Enter Game', '进入游戏'),
        actionKind: 'finish',
      };
  }
}

export const TutorialHint: React.FC<TutorialHintProps> = ({ step, totalSteps, displayStep, onSkip, onAdvance, language }) => {
  const content = getStepContent(step, language);
  const progress = Math.max(1, Math.min(totalSteps, displayStep));
  const showAdvance = content.actionKind !== 'wait';

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
                  {language === 'ru' ? 'Монеты' : language === 'zh' ? '金币' : 'Coins'}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-2 text-center">
                <BoosterGlyph className="mx-auto h-4.5 w-4.5 text-cyan-100" />
                <div className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/55">
                  {language === 'ru' ? 'Спец' : language === 'zh' ? '特效' : 'Specials'}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-2 text-center">
                <VaultGlyph className="mx-auto h-4.5 w-4.5 text-amber-100" />
                <div className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/55">
                  {language === 'ru' ? 'Магазин' : language === 'zh' ? '商店' : 'Shop'}
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
                {language === 'ru' ? 'Пропустить' : language === 'zh' ? '跳过' : 'Skip'}
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

          </div>
        </div>
      </div>
    </motion.div>
  );
};
