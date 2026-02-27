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
  descRu: string;
  descEn: string;
  pattern: PatternDot[];
  accent: string;
  cols?: number;
  rows?: number;
};

function ComboCard({ language, titleRu, titleEn, descRu, descEn, pattern, accent, cols = 5, rows = 3 }: ComboCardProps) {
  const isRu = language === 'ru';

  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
      <div className="flex items-start gap-3">
        <div className="grid gap-1 rounded-xl border border-white/10 bg-black/20 p-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols * rows }, (_, index) => {
            const x = index % cols;
            const y = Math.floor(index / cols);
            const active = pattern.some((item) => item.x === x && item.y === y);
            return (
              <div
                key={index}
                className={`h-4 w-4 rounded-[4px] border rotate-45 ${
                  active
                    ? `border-white/35 bg-gradient-to-br ${accent}`
                    : 'border-white/10 bg-white/5'
                }`}
              />
            );
          })}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-cyan-100">{isRu ? titleRu : titleEn}</div>
          <div className="mt-1 text-xs leading-relaxed text-white/75">{isRu ? descRu : descEn}</div>
        </div>
      </div>
    </div>
  );
}

export function GameGuideModal({ language, onClose }: GameGuideModalProps) {
  const isRu = language === 'ru';

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
          aria-label={isRu ? 'Закрыть руководство' : 'Close guide'}
        >
          <X size={18} />
        </button>

        <div className="pr-10">
          <h2 className="text-xl font-black">{isRu ? 'Руководство по игре' : 'Game Guide'}</h2>
          <p className="mt-1 text-sm text-white/70">
            {isRu ? 'Управление, элементы поля и все основные комбинации.' : 'Controls, board elements, and all main combinations.'}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
            <div className="mb-2 flex items-center gap-2 text-cyan-100">
              <MoveHorizontal size={16} />
              <span className="text-sm font-bold">{isRu ? 'Свайп' : 'Swipe'}</span>
            </div>
            <p className="text-xs text-white/80">
              {isRu ? 'Проведите по соседним кристаллам, чтобы поменять их местами и собрать линию из 3+.' : 'Swipe between adjacent gems to swap and make a line of 3+.'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
            <div className="mb-2 flex items-center gap-2 text-cyan-100">
              <MousePointer2 size={16} />
              <span className="text-sm font-bold">{isRu ? 'Тап' : 'Tap'}</span>
            </div>
            <p className="text-xs text-white/80">
              {isRu ? 'Нажмите на специальный элемент, чтобы активировать его эффект.' : 'Tap a special piece to trigger its effect.'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
            <div className="mb-2 flex items-center gap-2 text-cyan-100">
              <Hand size={16} />
              <span className="text-sm font-bold">{isRu ? 'Цепочка' : 'Chain'}</span>
            </div>
            <p className="text-xs text-white/80">
              {isRu ? 'После взрыва новые совпадения могут собраться сами и дать дополнительный урон/очки.' : 'After a clear, new automatic matches can chain for extra damage and score.'}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/15 bg-white/5 p-3">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-cyan-100">
            <Sparkles size={16} />
            {isRu ? 'Комбинации и специальные элементы' : 'Combinations and Special Pieces'}
          </div>
          <div className="grid grid-cols-1 gap-3">
            <ComboCard
              language={language}
              titleRu="3 в ряд: обычное совпадение"
              titleEn="3 in a row: Normal Match"
              descRu="Три одинаковых кристалла подряд просто очищаются и продвигают цель."
              descEn="Three matching gems in a row simply clear and progress the level goal."
              pattern={[{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }]}
              accent="from-cyan-300 to-blue-500"
            />
            <ComboCard
              language={language}
              titleRu="4 в ряд или квадрат 2x2: Бомба"
              titleEn="4 in a row or 2x2 square: Bomb"
              descRu="Линия из 4 или квадрат 2x2 создаёт Бомбу. Она взрывает центр и соседние клетки."
              descEn="A line of 4 or a 2x2 square creates a Bomb. It clears the center and adjacent tiles."
              pattern={[{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }]}
              accent="from-amber-300 to-orange-500"
            />
            <ComboCard
              language={language}
              titleRu="5 в линию: Молния"
              titleEn="5 in a line: Lightning"
              descRu="Только ровно 5 одинаковых в прямой линии создают Молнию. Она очищает целую строку или колонку."
              descEn="Only exactly 5 matching gems in one straight line create Lightning. It clears a full row or column."
              pattern={[{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }]}
              accent="from-sky-300 to-indigo-500"
            />
            <ComboCard
              language={language}
              titleRu="L-форма из 5: Крест"
              titleEn="L-shape of 5: Cross"
              descRu="Только L-образная форма из 5 элементов создаёт Крест. Он бьёт по строке и колонке."
              descEn="Only an L-shape of 5 creates Cross. It clears both row and column."
              pattern={[{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }]}
              accent="from-fuchsia-300 to-violet-500"
            />
            <ComboCard
              language={language}
              titleRu="T-форма из 5: Импульс"
              titleEn="T-shape of 5: Pulse"
              descRu="Классическая T-форма создаёт Импульс. Он бьёт по зоне вокруг себя."
              descEn="A classic T-shape creates Pulse. It clears an area around itself."
              pattern={[{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 1, y: 2 }]}
              accent="from-emerald-300 to-cyan-500"
            />
            <ComboCard
              language={language}
              titleRu="Расширенная T-форма (6-7): Нова"
              titleEn="Extended T-shape (6-7): Nova"
              descRu="Нова собирается из удлинённой T-формы: длинная линия из 4-5 и боковая ветка из 2 клеток от третьего элемента. Примеры: 2,6,10,11,12,14 и 1,6,11,12,13,16,21."
              descEn="Nova is created from an extended T-shape: a 4-5 long stem with a 2-cell side branch from the third tile. Examples: 2,6,10,11,12,14 and 1,6,11,12,13,16,21."
              pattern={[{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 0, y: 3 }]}
              accent="from-yellow-300 to-rose-500"
              cols={3}
              rows={4}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
