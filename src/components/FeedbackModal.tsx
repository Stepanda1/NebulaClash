import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquareText, Send, X } from 'lucide-react';
import type { Language } from '../i18n';
import { getAttributionPayload, getSessionId, trackEvent } from '../analytics';

type FeedbackModalProps = {
  language: Language;
  feedbackEmail: string;
  onClose: () => void;
};

export function FeedbackModal({ language, feedbackEmail, onClose }: FeedbackModalProps) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');

  const copy = useMemo(() => ({
    title: language === 'ru' ? 'Быстрый фидбек' : 'Quick Feedback',
    subtitle: language === 'ru'
      ? 'Напишите коротко, что понравилось, что мешает и чего не хватает.'
      : 'Briefly share what works, what blocks you, and what is missing.',
    name: language === 'ru' ? 'Имя' : 'Name',
    contact: language === 'ru' ? 'Telegram или email' : 'Telegram or email',
    message: language === 'ru' ? 'Ваш отзыв' : 'Your feedback',
    send: language === 'ru' ? 'Отправить' : 'Send',
    close: language === 'ru' ? 'Закрыть форму' : 'Close form',
  }), [language]);

  const onSubmit = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    const attribution = getAttributionPayload();
    const metaLines = [
      `session_id: ${getSessionId()}`,
      ...Object.entries(attribution).map(([key, value]) => `${key}: ${String(value)}`),
      `page: ${typeof window !== 'undefined' ? window.location.href : ''}`,
    ];

    const body = [
      `Name: ${name.trim() || '-'}`,
      `Contact: ${contact.trim() || '-'}`,
      '',
      trimmedMessage,
      '',
      '---',
      ...metaLines,
    ].join('\n');

    const subject = encodeURIComponent(language === 'ru' ? 'NebulaClash feedback' : 'NebulaClash feedback');
    const mailto = `mailto:${feedbackEmail}?subject=${subject}&body=${encodeURIComponent(body)}`;
    trackEvent('landing_feedback_submit', {
      has_name: !!name.trim(),
      has_contact: !!contact.trim(),
      message_length: trimmedMessage.length,
    });
    window.location.href = mailto;
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[94] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative w-full max-w-lg rounded-3xl border border-cyan-200/20 bg-slate-950/95 p-5 text-white shadow-[0_20px_70px_rgba(0,0,0,0.55)]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20"
          aria-label={copy.close}
        >
          <X size={18} />
        </button>

        <div className="pr-10">
          <div className="flex items-center gap-2 text-cyan-100">
            <MessageSquareText size={18} />
            <h2 className="text-lg font-black">{copy.title}</h2>
          </div>
          <p className="mt-2 text-sm text-white/70">{copy.subtitle}</p>
        </div>

        <div className="mt-4 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={copy.name}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-cyan-300/40"
          />
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder={copy.contact}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-cyan-300/40"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={copy.message}
            rows={5}
            className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-cyan-300/40"
          />
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={!message.trim()}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-200/30 bg-gradient-to-r from-cyan-300/20 via-sky-300/15 to-blue-400/20 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-cyan-100 transition-all hover:from-cyan-300/30 hover:via-sky-300/22 hover:to-blue-400/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={16} />
          {copy.send}
        </button>
      </motion.div>
    </motion.div>
  );
}
