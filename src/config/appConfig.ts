import type { LegalContacts } from '../types/legal';
import type { ShopPack } from '../types/shop';

export const BOOSTER_COST = 30;
export const MOVE_BOOST_AMOUNT = 5;
export const TIME_BOOST_SECONDS = 30;
export const TUTORIAL_SEEN_KEY = 'match3_tutorial_seen';
export const WALLET_TOKEN_KEY = 'match3_wallet_token';

export function getLegalContactsFromEnv(): LegalContacts {
  return {
    email: import.meta.env.VITE_CONTACT_EMAIL || 'stepanda3@yandex.ru',
    phone: import.meta.env.VITE_CONTACT_PHONE || '+79124869347',
    telegram: import.meta.env.VITE_CONTACT_TELEGRAM || 'https://t.me/your_username',
    facebook: import.meta.env.VITE_CONTACT_FACEBOOK || 'https://facebook.com/your.profile',
    instagram: import.meta.env.VITE_CONTACT_INSTAGRAM || 'https://instagram.com/your.profile',
    sellerName: import.meta.env.VITE_SELLER_NAME || 'Козлов Степан Александрович',
    sellerInn: import.meta.env.VITE_SELLER_INN || '591608402468',
  };
}

export function getCoinPacksFromEnv(): ShopPack[] {
  return [
    {
      id: 'pack-120',
      coins: 120,
      priceLabel: '99 ₽ / $1.19',
      url: import.meta.env.VITE_SHOP_PACK_SMALL_URL || undefined,
    },
    {
      id: 'pack-300',
      coins: 300,
      priceLabel: '199 ₽ / $2.39',
      url: import.meta.env.VITE_SHOP_PACK_MEDIUM_URL || undefined,
    },
    {
      id: 'pack-800',
      coins: 800,
      priceLabel: '499 ₽ / $5.99',
      url: import.meta.env.VITE_SHOP_PACK_LARGE_URL || undefined,
    },
  ];
}
