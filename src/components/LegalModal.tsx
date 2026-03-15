import { motion } from 'framer-motion';
import { Facebook, Instagram, Mail, Send, X } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import type { Language } from '../i18n';
import type { LegalContacts } from '../types/legal';
import { COPY } from '../i18n';

type LegalModalProps = {
  language: Language;
  contacts: LegalContacts;
  onManageConsent: () => void;
  onClose: () => void;
};

function TikTokIcon(props: LucideProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M14.23 3c.2 1.7 1.16 3.29 2.58 4.24a6.1 6.1 0 0 0 3.19 1v3.05a9.1 9.1 0 0 1-2.93-.48 9.3 9.3 0 0 1-2.84-1.42v6.34a5.9 5.9 0 1 1-5.9-5.9c.34 0 .67.03 1 .08v3.1a2.84 2.84 0 1 0 1.84 2.66V3h3.06Z" />
    </svg>
  );
}

export function LegalModal({
  language,
  contacts,
  onManageConsent,
  onClose,
}: LegalModalProps) {
  const t = COPY[language];
  const contactItems = [
    {
      id: 'email',
      label: 'Email',
      href: `mailto:${contacts.email}`,
      value: contacts.email,
      icon: Mail,
      style: 'from-cyan-300 via-sky-400 to-blue-600',
      glow: 'shadow-[0_0_20px_rgba(56,189,248,0.45)]',
    },
    {
      id: 'tiktok',
      label: 'TikTok',
      href: contacts.tiktok,
      value: contacts.tiktok,
      icon: TikTokIcon,
      style: 'from-fuchsia-300 via-pink-500 to-cyan-400',
      glow: 'shadow-[0_0_20px_rgba(217,70,239,0.45)]',
    },
    {
      id: 'telegram',
      label: 'Telegram',
      href: contacts.telegram,
      value: contacts.telegram,
      icon: Send,
      style: 'from-sky-300 via-cyan-400 to-indigo-500',
      glow: 'shadow-[0_0_20px_rgba(34,211,238,0.45)]',
    },
    {
      id: 'facebook',
      label: 'Facebook',
      href: contacts.facebook,
      value: contacts.facebook,
      icon: Facebook,
      style: 'from-blue-300 via-blue-500 to-indigo-700',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.45)]',
    },
    {
      id: 'instagram',
      label: 'Instagram',
      href: contacts.instagram,
      value: contacts.instagram,
      icon: Instagram,
      style: 'from-pink-300 via-fuchsia-500 to-orange-500',
      glow: 'shadow-[0_0_20px_rgba(236,72,153,0.45)]',
    },
  ] as const;

  const legalPdfLinks = [
    { id: 'offer', label: language === 'ru' ? 'Оферта' : 'Offer', href: '/LegalDocsPDF/01_Oferta.html' },
    { id: 'privacy', label: language === 'ru' ? 'Политика ПД' : 'Privacy policy', href: '/LegalDocsPDF/02_Privacy.html' },
    { id: 'refunds', label: language === 'ru' ? 'Возврат' : 'Refunds', href: '/LegalDocsPDF/03_Refunds.html' },
    { id: 'requisites', label: language === 'ru' ? 'Реквизиты' : 'Requisites', href: '/LegalDocsPDF/04_Requisites.html' },
    { id: 'assets', label: language === 'ru' ? 'Источники ассетов' : 'Asset sources', href: '/LegalDocsPDF/05_Asset_Sources.html' },
  ] as const;

  const renderContent = () => {
    return (
      <div className="space-y-4 text-sm text-white/90">
        <p>{language === 'ru' ? 'Контакты' : 'Contacts'}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {contactItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href={item.href}
                target={item.id === 'email' ? undefined : '_blank'}
                rel={item.id === 'email' ? undefined : 'noopener noreferrer'}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-2 py-3 transition-all hover:border-white/35 hover:bg-white/10"
              >
                <span className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${item.style} ${item.glow} transition-transform duration-200 group-hover:scale-105`}>
                  <span className="flex h-[3.15rem] w-[3.15rem] items-center justify-center rounded-full border border-white/30 bg-slate-950 text-white">
                    <Icon size={item.id === 'tiktok' ? 16 : 20} />
                  </span>
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/90">{item.label}</span>
              </a>
            );
          })}
        </div>
        <div className="rounded-xl border border-white/15 bg-white/5 p-3 text-xs leading-relaxed text-white/85">
          <p>{language === 'ru' ? 'Продавец:' : 'Seller:'} {contacts.sellerName}</p>
          <p>{language === 'ru' ? 'ИНН:' : 'TIN:'} {contacts.sellerInn}</p>
        </div>
        <button
          type="button"
          onClick={onManageConsent}
          className="w-full rounded-xl border border-amber-200/25 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-300/18"
        >
          {language === 'ru' ? 'Настроить аналитику и маркетинговые пиксели' : 'Manage analytics and marketing consent'}
        </button>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {legalPdfLinks.map((item) => (
            <a
              key={item.id}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-cyan-200/25 bg-cyan-300/10 px-3 py-2 text-center text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/20"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/75 p-3 pt-6 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <motion.div
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative my-auto w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/20 bg-slate-950/95 p-5 shadow-2xl max-h-[min(88dvh,48rem)]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition-all hover:bg-white/20"
          aria-label={t.close}
        >
          <X size={18} />
        </button>

        <div className="mb-3 pr-10 text-sm font-bold uppercase tracking-[0.08em] text-cyan-100">{t.contacts}</div>

        {renderContent()}
      </motion.div>
    </motion.div>
  );
}
