import { motion } from 'framer-motion';
import { Hand, MousePointer2, MoveHorizontal, X } from 'lucide-react';
import type { Language } from '../i18n';

type GameGuideModalProps = {
  language: Language;
  onClose: () => void;
};

const GEM_ITEMS = [
  { src: '/red.png', en: 'Red gem', ru: 'Красный кристалл' },
  { src: '/blue.png', en: 'Blue gem', ru: 'Синий кристалл' },
  { src: '/green.png', en: 'Green gem', ru: 'Зелёный кристалл' },
  { src: '/yellow.png', en: 'Yellow gem', ru: 'Жёлтый кристалл' },
];

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
            {isRu ? 'Быстрые правила управления и описание элементов.' : 'Quick controls and element reference.'}
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
              {isRu ? 'Нажмите на спец-элемент (бомба, молния и др.), чтобы активировать эффект.' : 'Tap a special piece (bomb, lightning, etc.) to trigger its effect.'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
            <div className="mb-2 flex items-center gap-2 text-cyan-100">
              <Hand size={16} />
              <span className="text-sm font-bold">{isRu ? 'Комбо' : 'Combo'}</span>
            </div>
            <p className="text-xs text-white/80">
              {isRu ? 'Цепочки и каскады дают больше очков и быстрее закрывают цель.' : 'Chains and cascades grant more score and complete goals faster.'}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/15 bg-white/5 p-3">
          <div className="text-sm font-bold text-cyan-100">{isRu ? 'Элементы поля' : 'Board Elements'}</div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {GEM_ITEMS.map((item) => (
              <div key={item.src} className="rounded-xl border border-white/10 bg-black/20 p-2 text-center">
                <img src={item.src} alt={isRu ? item.ru : item.en} className="mx-auto h-14 w-14 object-contain" />
                <div className="mt-1 text-[11px] text-white/85">{isRu ? item.ru : item.en}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-white/75">
            {isRu
              ? 'Собирайте 4-5 в ряд, чтобы создавать специальные элементы: бомбу, молнию, крест, импульс и нову.'
              : 'Match 4-5 gems to create special pieces: bomb, lightning, cross, pulse, and nova.'}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
