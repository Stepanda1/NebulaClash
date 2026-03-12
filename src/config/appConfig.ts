import type { LegalContacts } from '../types/legal';
import type { ShopPack } from '../types/shop';

export const BOOSTER_COST = 15;
export const MOVE_BOOST_AMOUNT = 5;
export const TIME_BOOST_SECONDS = 30;
export const TUTORIAL_SEEN_KEY = 'match3_tutorial_seen';
export const WALLET_TOKEN_KEY = 'match3_wallet_token';
export const PAYMENT_RETURN_TO_GAME_KEY = 'match3_payment_return_to_game';
export const PAYMENT_ORDER_ID_KEY = 'match3_payment_order_id';

export type MarketingLinks = {
  installUrl?: string;
  telegramUrl: string;
};

export function getLegalContactsFromEnv(): LegalContacts {
  return {
    email: import.meta.env.VITE_CONTACT_EMAIL || 'stepanda3@yandex.ru',
    tiktok: import.meta.env.VITE_CONTACT_TIKTOK || 'https://www.tiktok.com/@nebulaclash',
    telegram: import.meta.env.VITE_CONTACT_TELEGRAM || 'https://t.me/nebulaclash1',
    facebook: import.meta.env.VITE_CONTACT_FACEBOOK || 'https://www.facebook.com/share/g/18W9KdnGEn/',
    instagram: import.meta.env.VITE_CONTACT_INSTAGRAM || 'https://www.instagram.com/nebulaclash/',
    sellerName: import.meta.env.VITE_SELLER_NAME || 'Козлов Степан Александрович',
    sellerInn: import.meta.env.VITE_SELLER_INN || '591608402468',
  };
}

export function getCoinPacksFromEnv(): ShopPack[] {
  return [
    {
      id: 'pack-120',
      coins: 60,
      priceLabel: '99 ₽ / $1.19',
      url: import.meta.env.VITE_SHOP_PACK_SMALL_URL || undefined,
    },
    {
      id: 'pack-300',
      coins: 150,
      priceLabel: '199 ₽ / $2.39',
      url: import.meta.env.VITE_SHOP_PACK_MEDIUM_URL || undefined,
    },
    {
      id: 'pack-800',
      coins: 420,
      priceLabel: '499 ₽ / $5.99',
      url: import.meta.env.VITE_SHOP_PACK_LARGE_URL || undefined,
    },
  ];
}

export function getMarketingLinksFromEnv(fallbackTelegram: string): MarketingLinks {
  const installUrl = (import.meta.env.VITE_INSTALL_URL as string | undefined)?.trim();
  const telegramUrl = ((import.meta.env.VITE_MARKETING_TELEGRAM_URL as string | undefined)?.trim()) || fallbackTelegram;

  return {
    installUrl: installUrl || 'https://nebulaclash.com/',
    telegramUrl,
  };
}
