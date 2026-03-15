import { motion } from 'framer-motion';
import type { Language } from '../i18n';
import type { ShopPack } from '../types/shop';
import { COPY } from '../i18n';
import { BoosterGlyph, CloseGlyph, CoinGlyph, CosmicBackdrop, GiftGlyph, NebulaCoreIcon, TimeGlyph, VaultGlyph } from './CosmicArtwork';

type ShopModalProps = {
  language: Language;
  isTimeMode: boolean;
  offerContext: 'manual' | 'momentum' | 'recovery';
  coinsBalance: number;
  boosterCost: number;
  moveBoostAmount: number;
  timeBoostSeconds: number;
  packs: ShopPack[];
  starterBundle?: {
    active: boolean;
    expiresAt: string | null;
    pack: ShopPack;
    modifierTokens: number;
    continueReserve: number;
  };
  modifierTokens: number;
  continueReserve: number;
  missionAssistOffer?: {
    title: string;
    description: string;
    cta: string;
    onActivate: () => void;
  } | null;
  onClose: () => void;
  onBuyMoves: () => void;
  onBuyTime: () => void;
  onBuyPack: (packId: string) => void;
};

export function ShopModal({
  language,
  isTimeMode,
  offerContext,
  coinsBalance,
  boosterCost,
  moveBoostAmount,
  timeBoostSeconds,
  packs,
  starterBundle,
  modifierTokens,
  continueReserve,
  missionAssistOffer,
  onClose,
  onBuyMoves,
  onBuyTime,
  onBuyPack,
}: ShopModalProps) {
  const t = COPY[language];
  const coinLabel = language === 'ru' ? 'Космический магазин' : 'Space Shop';
  const boostersLabel = language === 'ru' ? 'Бустеры за монеты' : 'Boosters for coins';
  const hookLine = offerContext === 'recovery'
    ? (language === 'ru' ? 'Вернись в матч без паузы и не теряй прогресс' : 'Jump back in now and keep the run alive')
    : offerContext === 'momentum'
      ? (language === 'ru' ? 'Поймай темп после победы и дожми следующую волну' : 'Keep the momentum after a win and push the next wave')
      : (language === 'ru' ? 'Заряди запас и не выходи из ритма' : 'Load up and keep the streak alive');
  const premiumLine = offerContext === 'recovery'
    ? (language === 'ru' ? 'Монеты сразу дают запас на продолжения, бусты и ещё один шанс прямо в этой сессии.' : 'Coins immediately fund continues, boosts, and another chance in this same session.')
    : offerContext === 'momentum'
      ? (language === 'ru' ? 'Лучший момент для покупки: пока игра уже зашла, у тебя есть темп, а магазин конвертирует его в длинную сессию.' : 'Best purchase moment: the run already feels good, and coins stretch that momentum into a longer session.')
      : (language === 'ru' ? 'Первый топ-ап нужен не ради коллекции, а ради более длинной серии, быстрых рестартов и меньшего трения.' : 'Your first top-up is not for vanity. It buys longer streaks, faster recoveries, and less friction.');
  const hotDealLabel = language === 'ru' ? 'Стартовый оффер' : 'Starter Pick';
  const totalValueLabel = language === 'ru' ? 'Максимальный запас' : 'Max Reserve';
  const instantTopUpLabel = language === 'ru' ? 'Мгновенное пополнение' : 'Instant top-up';
  const claimLabel = language === 'ru' ? 'Забрать монеты' : 'Get Coins';
  const paymentsHintLine1 = language === 'ru' ? 'Оплата проходит на защищенной странице провайдера' : 'Payments are processed on a secure provider page';
  const paymentsHintLine2 = language === 'ru' ? 'После подтверждения монеты начисляются автоматически.' : 'Coins are credited automatically after payment confirmation.';
  const starterPackId = packs[Math.min(1, Math.max(0, packs.length - 1))]?.id ?? packs[0]?.id ?? '';
  const maxPackCoins = Math.max(...packs.map((p) => p.coins), 0);
  const starterOfferCountdown = starterBundle?.active && starterBundle.expiresAt
    ? Math.max(0, Math.floor((Date.parse(starterBundle.expiresAt) - Date.now()) / 1000))
    : 0;
  const starterCountdownLabel = starterOfferCountdown > 0
    ? `${Math.floor(starterOfferCountdown / 3600)}h ${Math.floor((starterOfferCountdown % 3600) / 60)}m`
    : (language === 'ru' ? 'До конца сессии' : 'This session');
  const visiblePacks = starterBundle?.active ? [starterBundle.pack, ...packs] : packs;
  const starterBundlePackId = starterBundle?.pack.id ?? '';
  const starterBundleTokenCount = starterBundle?.modifierTokens ?? 0;
  const starterBundleContinueCount = starterBundle?.continueReserve ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[80] flex items-center justify-center overflow-hidden bg-slate-950/72 backdrop-blur-sm p-3 sm:p-4"
    >
      <CosmicBackdrop variant="shop" className="opacity-95" />
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative flex max-h-[min(92vh,760px)] w-full max-w-[min(100%,30rem)] flex-col overflow-hidden rounded-3xl border border-cyan-100/20 bg-[linear-gradient(155deg,rgba(2,6,23,0.9)_0%,rgba(8,20,43,0.92)_34%,rgba(8,17,38,0.94)_100%)] text-white shadow-[0_20px_70px_rgba(0,0,0,0.55),0_0_60px_rgba(34,211,238,0.08)]"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-cyan-400/16 blur-3xl" />
          <div className="absolute right-[-20px] top-16 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl" />
          <div className="absolute left-[-18px] bottom-14 h-24 w-24 rounded-full bg-amber-400/10 blur-2xl" />
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(120deg,transparent_0%,rgba(148,163,184,0.04)_32%,rgba(255,255,255,0.02)_50%,transparent_100%)]" />
        </div>
        <div className="relative z-20 flex items-center justify-between border-b border-white/8 px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
          <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-200/80">
            <NebulaCoreIcon className="h-3.5 w-3.5 text-cyan-100" />
            {coinLabel}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-rose-200/35 bg-gradient-to-br from-rose-500 to-red-600 text-white transition-all hover:from-rose-400 hover:to-red-500 active:scale-95 shadow-[0_8px_24px_rgba(239,68,68,0.35)]"
            aria-label={language === 'ru' ? 'Закрыть магазин' : 'Close shop'}
          >
            <CloseGlyph className="h-4.5 w-4.5 text-white" />
          </button>
        </div>

        <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
        <div className="relative mb-4 overflow-hidden rounded-[1.8rem] border border-amber-200/20 bg-[linear-gradient(145deg,rgba(20,20,32,0.64)_0%,rgba(28,25,17,0.78)_45%,rgba(11,18,32,0.8)_100%)] p-4">
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-300/16 blur-2xl" />
          <div className="pointer-events-none absolute -left-6 bottom-0 h-24 w-24 rounded-full bg-cyan-300/12 blur-2xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="max-w-[58%]">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/80">
                {offerContext === 'recovery'
                  ? (language === 'ru' ? 'Оффер на возврат' : 'Recovery offer')
                  : offerContext === 'momentum'
                    ? (language === 'ru' ? 'Оффер на темп' : 'Momentum offer')
                    : (language === 'ru' ? 'Первый топ-ап' : 'First top-up')}
              </div>
              <div className="mt-3 text-xl font-black leading-tight text-white sm:text-2xl">
                {hookLine}
              </div>
              <div className="mt-2 text-xs leading-relaxed text-white/70">
                {premiumLine}
              </div>
            </div>
            <div className="relative mr-1 mt-1 flex h-24 w-24 shrink-0 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-amber-300/10 blur-xl" />
              <div className="absolute inset-[8%] rounded-full border border-white/10 bg-white/[0.03]" />
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [-4, 4, -4],
                  filter: [
                    'drop-shadow(0 0 16px rgba(251,191,36,0.24))',
                    'drop-shadow(0 0 26px rgba(251,191,36,0.42))',
                    'drop-shadow(0 0 16px rgba(251,191,36,0.24))',
                  ],
                }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                className="relative"
              >
                <CoinGlyph className="h-20 w-20" />
              </motion.div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-amber-200/20 bg-black/20 px-3 py-2.5">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-100/75">{instantTopUpLabel}</div>
              <div className="mt-1 text-sm font-semibold text-white/80">
                {offerContext === 'recovery'
                  ? (language === 'ru' ? 'Монеты для продолжений и бустов прямо сейчас' : 'Coins for continues and boosts right now')
                  : (language === 'ru' ? 'Монеты, чтобы не обрывать сессию' : 'Coins that keep the session going')}
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/35 bg-gradient-to-r from-amber-300/25 via-yellow-300/22 to-orange-300/24 px-3 py-1.5 shadow-[0_0_24px_rgba(251,191,36,0.2)]">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
                <CoinGlyph className="h-5 w-5" />
              </span>
              <span className="text-xl font-black text-amber-100">{coinsBalance}</span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs text-white/78">
            <div>
              <div className="uppercase tracking-[0.16em] text-white/55">{language === 'ru' ? 'Жетоны модификатора' : 'Modifier tokens'}</div>
              <div className="mt-1 text-lg font-black text-white">{modifierTokens}</div>
            </div>
            <div>
              <div className="uppercase tracking-[0.16em] text-white/55">{language === 'ru' ? 'Резерв продолжений' : 'Continue reserve'}</div>
              <div className="mt-1 text-lg font-black text-white">{continueReserve}</div>
            </div>
          </div>
          {starterBundle?.active && (
            <div className="mt-3 rounded-2xl border border-amber-200/30 bg-gradient-to-r from-amber-300/18 to-orange-400/16 p-3 text-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-100/85">{language === 'ru' ? 'Starter offer v2' : 'Starter offer v2'}</div>
                  <div className="mt-1 text-sm font-bold">
                    {language === 'ru'
                      ? `Первый платёж: +${starterBundle.pack.coins} монет, +${starterBundle.modifierTokens} жетон модификатора и ${starterBundle.continueReserve} продолжения`
                      : `First purchase: +${starterBundle.pack.coins} coins, +${starterBundle.modifierTokens} modifier token, ${starterBundle.continueReserve} continues`}
                  </div>
                </div>
                <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-50">
                  {starterCountdownLabel}
                </div>
              </div>
            </div>
          )}
          {missionAssistOffer && (
            <div className="mt-3 rounded-2xl border border-cyan-200/20 bg-cyan-300/10 p-3 text-white">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100/80">{language === 'ru' ? 'Mission assist' : 'Mission assist'}</div>
              <div className="mt-1 text-sm font-bold">{missionAssistOffer.title}</div>
              <div className="mt-1 text-xs text-white/72">{missionAssistOffer.description}</div>
              <button
                type="button"
                onClick={missionAssistOffer.onActivate}
                className="mt-3 rounded-full bg-gradient-to-r from-cyan-300 to-sky-400 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-900"
              >
                {missionAssistOffer.cta}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/75">{boostersLabel}</div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {!isTimeMode && (
                <button
                  onClick={onBuyMoves}
                  className="group rounded-2xl border border-cyan-200/25 bg-gradient-to-br from-cyan-400/14 to-blue-500/10 px-3 py-3 text-left transition-all hover:from-cyan-400/22 hover:to-blue-500/16 active:scale-[0.98]"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-200/25 bg-cyan-300/15">
                      <BoosterGlyph className="h-4 w-4 text-cyan-200" />
                    </span>
                    <span className="text-sm font-bold leading-tight">{t.buyExtraMoves}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-cyan-100/90">+{moveBoostAmount}</span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/20 bg-amber-300/10 px-2 py-0.5 text-amber-100">
                      <CoinGlyph className="h-3 w-3" />
                      {boosterCost}
                    </span>
                  </div>
                </button>
              )}
              {isTimeMode && (
                <button
                  onClick={onBuyTime}
                  className="group rounded-2xl border border-violet-200/20 bg-gradient-to-br from-violet-400/14 to-indigo-500/10 px-3 py-3 text-left transition-all hover:from-violet-400/22 hover:to-indigo-500/16 active:scale-[0.98]"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-violet-200/20 bg-violet-300/10">
                      <TimeGlyph className="h-4 w-4 text-violet-200" />
                    </span>
                    <span className="text-sm font-bold leading-tight">{t.buyExtraTime}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-violet-100/90">+{timeBoostSeconds}s</span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/20 bg-amber-300/10 px-2 py-0.5 text-amber-100">
                      <CoinGlyph className="h-3 w-3" />
                      {boosterCost}
                    </span>
                  </div>
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/75">{t.buyCoins}</div>
            <div className="grid grid-cols-1 gap-2.5">
              {visiblePacks.map((pack) => {
                const starterBundleCard = Boolean(starterBundle?.active) && pack.id === starterBundlePackId;
                const featured = starterBundleCard || pack.id === starterPackId;
                const reservePack = pack.coins === maxPackCoins;
                const continueCount = starterBundleCard
                  ? starterBundleContinueCount
                  : Math.max(1, Math.floor(pack.coins / boosterCost));
                const accent = featured
                  ? {
                      shell: 'border-amber-200/35 bg-[linear-gradient(135deg,rgba(251,191,36,0.16),rgba(249,115,22,0.12),rgba(14,165,233,0.12))] hover:from-amber-300/18',
                      label: 'text-amber-100/90',
                      button: 'from-amber-300 via-yellow-300 to-orange-400 text-amber-950',
                    }
                  : {
                      shell: 'border-cyan-200/20 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(59,130,246,0.1),rgba(15,23,42,0.08))]',
                      label: 'text-cyan-100/82',
                      button: 'from-cyan-300 via-sky-300 to-blue-400 text-slate-950',
                    };
                const cardClass = featured
                  ? accent.shell
                  : accent.shell;
                const content = (
                  <div className="relative overflow-hidden rounded-[1.4rem]">
                    <div className="pointer-events-none absolute -right-8 top-0 h-24 w-24 rounded-full bg-white/6 blur-2xl" />
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/12 bg-black/18">
                        <div className="absolute inset-0 rounded-2xl bg-white/[0.02]" />
                        <motion.div
                          animate={
                            featured
                              ? {
                                  scale: [1, 1.06, 1],
                                  rotate: [-3, 3, -3],
                                }
                              : {
                                  scale: [1, 1.03, 1],
                                }
                          }
                          transition={{
                            duration: featured ? 2.8 : 3.6,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                          className="relative"
                        >
                          <CoinGlyph className={`${featured ? 'h-11 w-11' : 'h-9 w-9'} drop-shadow-[0_0_18px_rgba(251,191,36,0.28)]`} />
                        </motion.div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-lg font-black leading-none text-white">{t.coinsAmount(pack.coins)}</div>
                            <div className="mt-1 text-xs font-semibold text-white/72">{pack.priceLabel}</div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/12 bg-white/5">
                              {featured ? <GiftGlyph className="h-4 w-4 text-amber-100" /> : <VaultGlyph className="h-4 w-4 text-cyan-100" />}
                            </span>
                            {featured && (
                              <span className="rounded-full border border-amber-200/30 bg-amber-300/12 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-100">
                                {starterBundleCard ? (language === 'ru' ? 'Первый платёж' : 'First purchase') : hotDealLabel}
                              </span>
                            )}
                            {!featured && reservePack && (
                              <span className="rounded-full border border-cyan-200/25 bg-cyan-300/12 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">
                                {totalValueLabel}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={`mt-2 text-[11px] font-black uppercase tracking-[0.16em] ${accent.label}`}>
                          {starterBundleCard
                            ? (language === 'ru' ? 'Пакет для первого платежа с бонусами профиля' : 'First-purchase bundle with profile perks')
                            : featured
                            ? (language === 'ru' ? 'Лучший первый пак для реальной сессии' : 'Best first pack for a real session')
                            : reservePack
                              ? (language === 'ru' ? 'Большой запас на длинную неделю' : 'Big reserve for a longer week')
                              : (language === 'ru' ? 'Быстрый заряд для серии' : 'Fast fuel for your streak')}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/70">
                        <CoinGlyph className="h-3.5 w-3.5" />
                        {starterBundleCard
                          ? (language === 'ru' ? `+${starterBundleTokenCount} жетон и ${continueCount} продолжения` : `+${starterBundleTokenCount} token and ${continueCount} continues`)
                          : (language === 'ru' ? `${continueCount} продолжений` : `${continueCount} continue plays`)}
                      </div>
                      <span className={`inline-flex items-center justify-center rounded-full bg-gradient-to-r px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] shadow-[0_8px_18px_rgba(0,0,0,0.2)] ${accent.button}`}>
                        {claimLabel}
                      </span>
                    </div>
                  </div>
                );

                if (pack.url) {
                  return (
                    <a
                      key={pack.id}
                      href={pack.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`rounded-2xl border p-3 transition-all hover:scale-[1.01] active:scale-[0.98] ${cardClass}`}
                    >
                      {content}
                    </a>
                  );
                }

                return (
                  <button
                    type="button"
                    key={pack.id}
                    onClick={() => onBuyPack(pack.id)}
                    className={`rounded-2xl border p-3 text-left transition-all hover:scale-[1.01] active:scale-[0.98] ${cardClass}`}
                  >
                    {content}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/65 leading-relaxed">
              {paymentsHintLine1}
              <br />
              {paymentsHintLine2}
            </div>
          </div>
        </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
