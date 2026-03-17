import { motion } from 'framer-motion';
import { Hand, MousePointer2, MoveHorizontal, Sparkles, X } from 'lucide-react';
import type { Language } from '../i18n';

type GameGuideModalProps = {
  language: Language;
  onClose: () => void;
};

type PatternDot = {
  x: number;
  y: number;
};

type ComboCardProps = {
  language: Language;
  titleRu: string;
  titleEn: string;
  titleZh: string;
  descRu: string;
  descEn: string;
  descZh: string;
  pattern: PatternDot[];
  accent: string;
  cols?: number;
  rows?: number;
};

function ComboCard({ language, titleRu, titleEn, titleZh, descRu, descEn, descZh, pattern, accent, cols = 5, rows = 3 }: ComboCardProps) {
  const title = language === 'ru' ? titleRu : language === 'zh' ? titleZh : titleEn;
  const desc = language === 'ru' ? descRu : language === 'zh' ? descZh : descEn;

  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div
          className="grid shrink-0 gap-1.5 rounded-xl border border-white/10 bg-black/20 p-2.5"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: cols * rows }, (_, index) => {
            const x = index % cols;
            const y = Math.floor(index / cols);
            const active = pattern.some((item) => item.x === x && item.y === y);
            return (
              <div
                key={index}
                className={`h-3.5 w-3.5 rounded-[4px] border rotate-45 sm:h-4 sm:w-4 ${
                  active
                    ? `border-white/35 bg-gradient-to-br ${accent}`
                    : 'border-white/10 bg-white/5'
                }`}
              />
            );
          })}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-cyan-100">{title}</div>
          <div className="mt-1 text-xs leading-relaxed text-white/75">{desc}</div>
        </div>
      </div>
    </div>
  );
}

export function GameGuideModal({ language, onClose }: GameGuideModalProps) {
  const tx = (ru: string, en: string, zh: string) => language === 'ru' ? ru : language === 'zh' ? zh : en;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[92] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative w-full max-w-3xl max-h-[86vh] overflow-y-auto rounded-3xl border border-cyan-200/25 bg-slate-950/95 p-5 text-white shadow-[0_20px_70px_rgba(0,0,0,0.55)]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white hover:bg-white/20"
          aria-label={tx('Закрыть руководство', 'Close guide', '关闭指南')}
        >
          <X size={18} />
        </button>

        <div className="pr-10">
          <h2 className="text-xl font-black">{tx('Руководство по игре', 'Game Guide', '游戏指南')}</h2>
          <p className="mt-1 text-sm text-white/70">
            {tx('Управление, элементы поля и все основные комбинации.', 'Controls, board elements, and all main combinations.', '操作方式、棋盘元素与全部核心组合。')}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
            <div className="mb-2 flex items-center gap-2 text-cyan-100">
              <MoveHorizontal size={16} />
              <span className="text-sm font-bold">{tx('Свайп', 'Swipe', '滑动')}</span>
            </div>
            <p className="text-xs text-white/80">
              {tx('Проведите по соседним кристаллам, чтобы поменять их местами и собрать линию из 3+.', 'Swipe between adjacent gems to swap and make a line of 3+.', '滑动相邻宝石进行交换，组成 3 个或更多的连线。')}
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
            <div className="mb-2 flex items-center gap-2 text-cyan-100">
              <MousePointer2 size={16} />
              <span className="text-sm font-bold">{tx('Тап', 'Tap', '点击')}</span>
            </div>
            <p className="text-xs text-white/80">
              {tx('Нажмите на специальный элемент, чтобы активировать его эффект.', 'Tap a special piece to trigger its effect.', '点击特殊棋子即可触发效果。')}
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
            <div className="mb-2 flex items-center gap-2 text-cyan-100">
              <Hand size={16} />
              <span className="text-sm font-bold">{tx('Цепочка', 'Chain', '连锁')}</span>
            </div>
            <p className="text-xs text-white/80">
              {tx('После взрыва новые совпадения могут собраться сами и дать дополнительный урон/очки.', 'After a clear, new automatic matches can chain for extra damage and score.', '清除后可能会自动形成新的匹配，带来额外伤害和分数。')}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/15 bg-white/5 p-3">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-cyan-100">
            <Sparkles size={16} />
            {tx('Комбинации и специальные элементы', 'Combinations and Special Pieces', '组合与特殊棋子')}
          </div>
          <div className="grid grid-cols-1 gap-3">
            <ComboCard
              language={language}
              titleRu="3 в ряд: обычное совпадение"
              titleEn="3 in a row: Normal Match"
              titleZh="3 连：普通消除"
              descRu="Три одинаковых кристалла подряд просто очищаются и продвигают цель."
              descEn="Three matching gems in a row simply clear and progress the level goal."
              descZh="三个相同宝石连成一线时会直接消除，并推进关卡目标。"
              pattern={[{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }]}
              accent="from-cyan-300 to-blue-500"
            />
            <ComboCard
              language={language}
              titleRu="4 в ряд или квадрат 2x2: Бомба"
              titleEn="4 in a row or 2x2 square: Bomb"
              titleZh="4 连或 2x2 方块：炸弹"
              descRu="Линия из 4 или квадрат 2x2 создаёт Бомбу. Она взрывает центр и соседние клетки."
              descEn="A line of 4 or a 2x2 square creates a Bomb. It clears the center and adjacent tiles."
              descZh="4 连或 2x2 方块会生成炸弹，炸掉中心和周围格子。"
              pattern={[{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }]}
              accent="from-amber-300 to-orange-500"
            />
            <ComboCard
              language={language}
              titleRu="5 в линию: Молния"
              titleEn="5 in a line: Lightning"
              titleZh="5 连直线：闪电"
              descRu="Только ровно 5 одинаковых в прямой линии создают Молнию. Она очищает целую строку или колонку."
              descEn="Only exactly 5 matching gems in one straight line create Lightning. It clears a full row or column."
              descZh="只有 5 个相同宝石排成一条直线时才会生成闪电，它会清除整行或整列。"
              pattern={[{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }]}
              accent="from-sky-300 to-indigo-500"
            />
            <ComboCard
              language={language}
              titleRu="L-форма из 5: Крест"
              titleEn="L-shape of 5: Cross"
              titleZh="5 格 L 形：十字"
              descRu="Только L-образная форма из 5 элементов создаёт Крест. Он бьёт по строке и колонке."
              descEn="Only an L-shape of 5 creates Cross. It clears both row and column."
              descZh="只有 5 格 L 形才会生成十字，它会同时清除一行和一列。"
              pattern={[{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }]}
              accent="from-fuchsia-300 to-violet-500"
            />
            <ComboCard
              language={language}
              titleRu="T-форма из 5: Импульс"
              titleEn="T-shape of 5: Pulse"
              titleZh="5 格 T 形：脉冲"
              descRu="Классическая T-форма создаёт Импульс. Он бьёт по зоне вокруг себя."
              descEn="A classic T-shape creates Pulse. It clears an area around itself."
              descZh="经典 T 形会生成脉冲，清除周围区域。"
              pattern={[{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 1, y: 2 }]}
              accent="from-emerald-300 to-cyan-500"
            />
            <ComboCard
              language={language}
              titleRu="Расширенная T-форма (6-7): Нова"
              titleEn="Extended T-shape (6-7): Nova"
              titleZh="扩展 T 形（6-7 格）：新星"
              descRu="Нова собирается из удлинённой T-формы: длинный стержень и поперечная линия от его центральной части. Ниже показан вариант на 7 элементов."
              descEn="Nova is created from an extended T-shape: a long stem with a crossbar branching from its middle. The diagram below shows the 7-tile version."
              descZh="新星由加长 T 形生成：一条长竖线加上从中间伸出的横线。下图展示的是 7 格版本。"
              pattern={[{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 }]}
              accent="from-yellow-300 to-rose-500"
              cols={5}
              rows={5}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
