import { useState } from 'react';
import type { Language } from '../i18n';

type AdminAccessModalProps = {
  language: Language;
  onSubmit: (username: string, password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
};

export function AdminAccessModal({ language, onSubmit, isLoading, error }: AdminAccessModalProps) {
  const isRu = language === 'ru';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/88 px-4 backdrop-blur-md">
      <form
        className="w-full max-w-sm rounded-[2rem] border border-cyan-200/20 bg-[linear-gradient(180deg,rgba(9,18,42,0.97),rgba(4,9,22,0.99))] p-6 shadow-[0_24px_80px_rgba(34,211,238,0.18)]"
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit(username, password);
        }}
      >
        <div className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200/70">Admin</div>
        <h2 className="mt-2 text-3xl font-black text-white">
          {isRu ? 'Тестовый вход' : 'Admin Access'}
        </h2>
        <p className="mt-2 text-sm text-white/60">
          {isRu ? 'Введите логин и пароль для отдельной тестовой панели.' : 'Enter login and password for the separate test panel.'}
        </p>

        <div className="mt-5 space-y-3">
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder={isRu ? 'Логин' : 'Login'}
            className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-cyan-300/45"
            autoComplete="username"
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder={isRu ? 'Пароль' : 'Password'}
            className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-cyan-300/45"
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="mt-3 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-xs font-bold text-rose-100">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-5 w-full rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-slate-950 transition-all hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (isRu ? 'Входим...' : 'Signing in...') : (isRu ? 'Войти' : 'Sign in')}
        </button>
      </form>
    </div>
  );
}
