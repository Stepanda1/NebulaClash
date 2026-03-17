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
  const tx = (ru: string, en: string, zh: string) => language === 'ru' ? ru : language === 'zh' ? zh : en;

  const actionClassName = 'rounded-2xl border border-cyan-200/20 bg-white/8 px-3 py-3 text-left transition-all hover:bg-white/12 active:scale-[0.98]';

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-slate-950/78 px-3 pt-6 backdrop-blur-sm sm:items-center sm:px-4">
      <div className="my-auto max-h-[min(88dvh,46rem)] w-full max-w-md overflow-y-auto rounded-[2rem] border border-cyan-200/20 bg-[linear-gradient(180deg,rgba(8,16,38,0.96),rgba(5,10,24,0.98))] p-5 shadow-[0_24px_80px_rgba(8,145,178,0.22)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200/70">Admin</div>
            <h3 className="mt-1 text-2xl font-black text-white">
              {tx('Панель управления', 'Control Panel', '控制面板')}
            </h3>
            <p className="mt-2 text-xs text-white/65 break-all">
              {playerId || tx('Аккаунт не определен', 'Account not resolved', '账户未识别')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-black uppercase tracking-wide text-white/70 transition hover:bg-white/12"
          >
            {tx('Закрыть', 'Close', '关闭')}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={() => onGrantCoins(100)} className={actionClassName}>
            <div className="text-xs font-black uppercase tracking-wide text-amber-200">{tx('+100 монет', '+100 coins', '+100 金币')}</div>
            <div className="mt-1 text-[11px] text-white/55">{tx('Мгновенно в кошелек', 'Instant wallet top-up', '立即充值到钱包')}</div>
          </button>
          <button type="button" onClick={() => onGrantCoins(500)} className={actionClassName}>
            <div className="text-xs font-black uppercase tracking-wide text-amber-200">{tx('+500 монет', '+500 coins', '+500 金币')}</div>
            <div className="mt-1 text-[11px] text-white/55">{tx('Быстрый буст баланса', 'Fast balance boost', '快速提升余额')}</div>
          </button>
          <button type="button" onClick={onAddMoves} className={actionClassName}>
            <div className="text-xs font-black uppercase tracking-wide text-emerald-200">{tx('+5 ходов', '+5 moves', '+5 步')}</div>
            <div className="mt-1 text-[11px] text-white/55">{tx('Только для режима ходов', 'Moves mode only', '仅限步数模式')}</div>
          </button>
          <button type="button" onClick={onAddTime} className={actionClassName}>
            <div className="text-xs font-black uppercase tracking-wide text-emerald-200">{tx('+30 секунд', '+30 seconds', '+30 秒')}</div>
            <div className="mt-1 text-[11px] text-white/55">{tx('Только для таймера', 'Timer mode only', '仅限计时模式')}</div>
          </button>
          <button type="button" onClick={onSpawnBomb} className={actionClassName}>
            <div className="text-xs font-black uppercase tracking-wide text-rose-200">{tx('Выдать бомбу', 'Spawn bomb', '生成炸弹')}</div>
            <div className="mt-1 text-[11px] text-white/55">{tx('Случайная клетка', 'Random tile', '随机格子')}</div>
          </button>
          <button type="button" onClick={onSpawnLightning} className={actionClassName}>
            <div className="text-xs font-black uppercase tracking-wide text-sky-200">{tx('Выдать молнию', 'Spawn lightning', '生成闪电')}</div>
            <div className="mt-1 text-[11px] text-white/55">{tx('Случайная клетка', 'Random tile', '随机格子')}</div>
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          <button
            type="button"
            onClick={onUnlockAllLevels}
            className="rounded-2xl border border-fuchsia-200/20 bg-fuchsia-400/10 px-3 py-3 text-left transition-all hover:bg-fuchsia-400/14 active:scale-[0.98]"
          >
            <div className="text-xs font-black uppercase tracking-wide text-fuchsia-100">{tx('Открыть все уровни', 'Unlock all levels', '解锁全部关卡')}</div>
            <div className="mt-1 text-[11px] text-white/55">{tx('Только локально для этой сессии', 'Local to this player only', '仅当前本地会话有效')}</div>
          </button>
          <button
            type="button"
            onClick={onResetLocalProgress}
            className="rounded-2xl border border-orange-200/20 bg-orange-400/10 px-3 py-3 text-left transition-all hover:bg-orange-400/14 active:scale-[0.98]"
          >
            <div className="text-xs font-black uppercase tracking-wide text-orange-100">{tx('Сбросить мой локальный прогресс', 'Reset my local progress', '重置我的本地进度')}</div>
            <div className="mt-1 text-[11px] text-white/55">{tx('Карта, звезды и обучение', 'Map, stars, and tutorial', '地图、星级和教程')}</div>
          </button>
        </div>
      </div>
    </div>
  );
}
