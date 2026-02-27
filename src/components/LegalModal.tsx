import { motion } from 'framer-motion';
import { Facebook, Instagram, Mail, Phone, Send, X } from 'lucide-react';
import type { Language } from '../i18n';
import type { LegalContacts } from '../types/legal';
import { COPY } from '../i18n';

type LegalModalProps = {
  language: Language;
  contacts: LegalContacts;
  onClose: () => void;
};

export function LegalModal({
  language,
  contacts,
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
      id: 'phone',
      label: language === 'ru' ? 'Телефон' : 'Phone',
      href: `tel:${contacts.phone}`,
      value: contacts.phone,
      icon: Phone,
      style: 'from-emerald-300 via-green-500 to-teal-700',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.45)]',
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
    { id: 'offer', label: language === 'ru' ? 'Оферта (PDF)' : 'Offer (PDF)', href: '/LegalDocsPDF/01_Oferta.pdf' },
    { id: 'privacy', label: language === 'ru' ? 'Конфиденциальность (PDF)' : 'Privacy (PDF)', href: '/LegalDocsPDF/02_Privacy.pdf' },
    { id: 'refunds', label: language === 'ru' ? 'Возврат (PDF)' : 'Refunds (PDF)', href: '/LegalDocsPDF/03_Refunds.pdf' },
    { id: 'requisites', label: language === 'ru' ? 'Реквизиты (PDF)' : 'Requisites (PDF)', href: '/LegalDocsPDF/04_Requisites.pdf' },
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
                    <Icon size={20} />
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
      className="absolute inset-0 z-[90] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative w-full max-w-2xl rounded-3xl border border-white/20 bg-slate-950/95 p-5 shadow-2xl"
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
