import type { Language } from '../i18n';

type AdminModalProps = {
  language: Language;
  playerId: string;
  onClose: () => void;
  onGrantCoins: (amount: number) => void;
  onAddMoves: () => void;
  onAddTime: () => void;
  onSpawnBomb: () => void;
  onSpawnLightning: () => void;
  onUnlockAllLevels: () => void;
  onResetLocalProgress: () => void;
};

export function AdminModal({
  language,
  playerId,
  onClose,
  onGrantCoins,
  onAddMoves,
  onAddTime,
  onSpawnBomb,
  onSpawnLightning,
  onUnlockAllLevels,
  onResetLocalProgress,
}: AdminModalProps) {
  const isRu = language === 'ru';

  const actionClassName = 'rounded-2xl border border-cyan-200/20 bg-white/8 px-3 py-3 text-left transition-all hover:bg-white/12 active:scale-[0.98]';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/78 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] border border-cyan-200/20 bg-[linear-gradient(180deg,rgba(8,16,38,0.96),rgba(5,10,24,0.98))] p-5 shadow-[0_24px_80px_rgba(8,145,178,0.22)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200/70">Admin</div>
            <h3 className="mt-1 text-2xl font-black text-white">
              {isRu ? 'Панель управления' : 'Control Panel'}
            </h3>
            <p className="mt-2 text-xs text-white/65 break-all">
              {playerId || (isRu ? 'Аккаунт не определен' : 'Account not resolved')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-black uppercase tracking-wide text-white/70 transition hover:bg-white/12"
          >
            {isRu ? 'Закрыть' : 'Close'}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={() => onGrantCoins(100)} className={actionClassName}>
            <div className="text-xs font-black uppercase tracking-wide text-amber-200">{isRu ? '+100 монет' : '+100 coins'}</div>
            <div className="mt-1 text-[11px] text-white/55">{isRu ? 'Мгновенно в кошелек' : 'Instant wallet top-up'}</div>
          </button>
          <button type="button" onClick={() => onGrantCoins(500)} className={actionClassName}>
            <div className="text-xs font-black uppercase tracking-wide text-amber-200">{isRu ? '+500 монет' : '+500 coins'}</div>
            <div className="mt-1 text-[11px] text-white/55">{isRu ? 'Быстрый буст баланса' : 'Fast balance boost'}</div>
          </button>
          <button type="button" onClick={onAddMoves} className={actionClassName}>
            <div className="text-xs font-black uppercase tracking-wide text-emerald-200">{isRu ? '+5 ходов' : '+5 moves'}</div>
            <div className="mt-1 text-[11px] text-white/55">{isRu ? 'Только для режима ходов' : 'Moves mode only'}</div>
          </button>
          <button type="button" onClick={onAddTime} className={actionClassName}>
            <div className="text-xs font-black uppercase tracking-wide text-emerald-200">{isRu ? '+30 секунд' : '+30 seconds'}</div>
            <div className="mt-1 text-[11px] text-white/55">{isRu ? 'Только для таймера' : 'Timer mode only'}</div>
          </button>
          <button type="button" onClick={onSpawnBomb} className={actionClassName}>
            <div className="text-xs font-black uppercase tracking-wide text-rose-200">{isRu ? 'Выдать бомбу' : 'Spawn bomb'}</div>
            <div className="mt-1 text-[11px] text-white/55">{isRu ? 'Случайная клетка' : 'Random tile'}</div>
          </button>
          <button type="button" onClick={onSpawnLightning} className={actionClassName}>
            <div className="text-xs font-black uppercase tracking-wide text-sky-200">{isRu ? 'Выдать молнию' : 'Spawn lightning'}</div>
            <div className="mt-1 text-[11px] text-white/55">{isRu ? 'Случайная клетка' : 'Random tile'}</div>
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          <button
            type="button"
            onClick={onUnlockAllLevels}
            className="rounded-2xl border border-fuchsia-200/20 bg-fuchsia-400/10 px-3 py-3 text-left transition-all hover:bg-fuchsia-400/14 active:scale-[0.98]"
          >
            <div className="text-xs font-black uppercase tracking-wide text-fuchsia-100">{isRu ? 'Открыть все уровни' : 'Unlock all levels'}</div>
            <div className="mt-1 text-[11px] text-white/55">{isRu ? 'Только локально для этой сессии' : 'Local to this player only'}</div>
          </button>
          <button
            type="button"
            onClick={onResetLocalProgress}
            className="rounded-2xl border border-orange-200/20 bg-orange-400/10 px-3 py-3 text-left transition-all hover:bg-orange-400/14 active:scale-[0.98]"
          >
            <div className="text-xs font-black uppercase tracking-wide text-orange-100">{isRu ? 'Сбросить мой локальный прогресс' : 'Reset my local progress'}</div>
            <div className="mt-1 text-[11px] text-white/55">{isRu ? 'Карта, звезды и обучение' : 'Map, stars, and tutorial'}</div>
          </button>
        </div>
      </div>
    </div>
  );
}
