import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { Language } from '../i18n';
import { COPY } from '../i18n';

export type LegalSection = 'offer' | 'privacy' | 'refunds' | 'contacts';

type Contacts = {
  email: string;
  telegram: string;
  facebook: string;
  instagram: string;
};

type LegalModalProps = {
  language: Language;
  section: LegalSection;
  contacts: Contacts;
  onClose: () => void;
  onSelectSection: (section: LegalSection) => void;
};

export function LegalModal({
  language,
  section,
  contacts,
  onClose,
  onSelectSection,
}: LegalModalProps) {
  const t = COPY[language];

  const tabs: LegalSection[] = ['offer', 'privacy', 'refunds', 'contacts'];

  const renderContent = () => {
    if (section === 'offer') {
      return (
        <div className="space-y-3 text-sm text-white/90">
          <p>{language === 'ru' ? 'Публичная оферта на цифровой контент' : 'Public offer for digital content'}</p>
          <p>
            {language === 'ru'
              ? 'Сервис предоставляет доступ к цифровому контенту и внутриигровой валюте (космические монеты) для использования в игре.'
              : 'The service provides access to digital content and in-game currency (Space Coins) for use inside the game.'}
          </p>
          <p>
            {language === 'ru'
              ? 'Оплата означает акцепт оферты. Цифровой контент предоставляется сразу после подтверждения платежа.'
              : 'Payment means acceptance of this offer. Digital content is delivered immediately after payment confirmation.'}
          </p>
          <p>
            {language === 'ru'
              ? 'Космические монеты не являются электронными денежными средствами, не подлежат обмену на рубли и используются только внутри игры.'
              : 'Space Coins are not electronic money, cannot be exchanged for fiat, and are used only in-game.'}
          </p>
        </div>
      );
    }

    if (section === 'privacy') {
      return (
        <div className="space-y-3 text-sm text-white/90">
          <p>{language === 'ru' ? 'Политика конфиденциальности' : 'Privacy policy'}</p>
          <p>
            {language === 'ru'
              ? 'Мы обрабатываем технические данные: идентификатор игрока, события игры, данные платежного статуса.'
              : 'We process technical data: player identifier, gameplay events, and payment status data.'}
          </p>
          <p>
            {language === 'ru'
              ? 'Платежные реквизиты обрабатываются платежным провайдером и не хранятся в приложении.'
              : 'Payment details are processed by the payment provider and are not stored by the app.'}
          </p>
          <p>
            {language === 'ru'
              ? 'Данные используются для работы сервиса, начисления покупок и поддержки пользователей.'
              : 'Data is used to operate the service, credit purchases, and provide support.'}
          </p>
        </div>
      );
    }

    if (section === 'refunds') {
      return (
        <div className="space-y-3 text-sm text-white/90">
          <p>{language === 'ru' ? 'Правила возврата' : 'Refund policy'}</p>
          <p>
            {language === 'ru'
              ? 'Возврат рассматривается по запросу пользователя при ошибочном или дублирующем платеже.'
              : 'Refunds are considered upon request for accidental or duplicate payments.'}
          </p>
          <p>
            {language === 'ru'
              ? 'Если цифровой контент уже начислен и использован, возврат может быть ограничен в соответствии с правилами платежного провайдера и законодательством.'
              : 'If digital content has already been credited and used, refunds may be limited under provider rules and law.'}
          </p>
          <p>
            {language === 'ru'
              ? 'По вопросам возврата свяжитесь с нами через контакты ниже.'
              : 'For refund requests, contact us using the details below.'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3 text-sm text-white/90">
        <p>{language === 'ru' ? 'Контакты' : 'Contacts'}</p>
        <p>
          Email:{' '}
          <a className="text-cyan-300 underline" href={`mailto:${contacts.email}`}>
            {contacts.email}
          </a>
        </p>
        <p>
          Telegram:{' '}
          <a className="text-cyan-300 underline" href={contacts.telegram} target="_blank" rel="noopener noreferrer">
            {contacts.telegram}
          </a>
        </p>
        <p>
          Facebook:{' '}
          <a className="text-cyan-300 underline" href={contacts.facebook} target="_blank" rel="noopener noreferrer">
            {contacts.facebook}
          </a>
        </p>
        <p>
          Instagram:{' '}
          <a className="text-cyan-300 underline" href={contacts.instagram} target="_blank" rel="noopener noreferrer">
            {contacts.instagram}
          </a>
        </p>
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

        <div className="mb-3 flex flex-wrap gap-2 pr-10">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onSelectSection(tab)}
              className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] ${
                section === tab
                  ? 'border-cyan-300 bg-cyan-300/20 text-cyan-100'
                  : 'border-white/25 bg-white/5 text-white/80'
              }`}
            >
              {tab === 'offer' && t.offer}
              {tab === 'privacy' && t.privacy}
              {tab === 'refunds' && t.refunds}
              {tab === 'contacts' && t.contacts}
            </button>
          ))}
        </div>

        {renderContent()}
      </motion.div>
    </motion.div>
  );
}
