import { useCallback, useEffect, useRef, useState } from 'react';
import type { Language } from '../i18n';
import { PAYMENT_RETURN_TO_GAME_KEY, WALLET_TOKEN_KEY } from '../config/appConfig';
import type { ShopPack } from '../types/shop';

type UseWalletOptions = {
  language: Language;
  coinPacks: ShopPack[];
  notEnoughCoinsMessage: string;
  walletUnavailableMessage: string;
  shopPackUnavailableMessage: string;
  onPaymentStatus: (status: 'success' | 'fail') => void;
  onPackCheckout: (packId: string) => void;
};

export function useWallet({
  language,
  coinPacks,
  notEnoughCoinsMessage,
  walletUnavailableMessage,
  shopPackUnavailableMessage,
  onPaymentStatus,
  onPackCheckout,
}: UseWalletOptions) {
  const [spaceCoins, setSpaceCoins] = useState(120);
  const [shopNotice, setShopNotice] = useState<string | null>(null);
  const [walletToken, setWalletToken] = useState('');
  const [walletReady, setWalletReady] = useState(false);
  const [playerId, setPlayerId] = useState('');
  const walletInitInFlightRef = useRef(false);

  const syncWalletBalance = useCallback(async (): Promise<boolean> => {
    if (!walletToken) return false;
    try {
      const response = await fetch('/api/wallet', {
        headers: {
          Authorization: `Bearer ${walletToken}`,
        },
      });
      if (!response.ok) return false;
      const payload = await response.json() as { balance?: number; playerId?: string };
      if (typeof payload.balance === 'number' && Number.isFinite(payload.balance)) {
        setSpaceCoins(Math.max(0, Math.floor(payload.balance)));
      }
      if (payload.playerId) {
        setPlayerId(String(payload.playerId));
      }
      return true;
    } catch {
      return false;
    }
  }, [walletToken]);

  const spendCoins = useCallback(async (cost: number): Promise<boolean> => {
    if (!walletReady || !walletToken) {
      setShopNotice(walletUnavailableMessage);
      return false;
    }

    if (spaceCoins < cost) {
      setShopNotice(notEnoughCoinsMessage);
      return false;
    }

    try {
      const response = await fetch('/api/wallet/spend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${walletToken}`,
        },
        body: JSON.stringify({ amount: cost }),
      });

      const payload = await response.json().catch(() => ({})) as { balance?: number };

      if (response.status === 409) {
        if (typeof payload.balance === 'number') {
          setSpaceCoins(Math.max(0, Math.floor(payload.balance)));
        }
        setShopNotice(notEnoughCoinsMessage);
        return false;
      }

      if (!response.ok) {
        setShopNotice(walletUnavailableMessage);
        await syncWalletBalance();
        return false;
      }

      if (typeof payload.balance === 'number') {
        setSpaceCoins(Math.max(0, Math.floor(payload.balance)));
      } else {
        await syncWalletBalance();
      }

      return true;
    } catch {
      setShopNotice(walletUnavailableMessage);
      await syncWalletBalance();
      return false;
    }
  }, [notEnoughCoinsMessage, spaceCoins, syncWalletBalance, walletReady, walletToken, walletUnavailableMessage]);

  const buyCoinsPack = useCallback(async (packId: string) => {
    const pack = coinPacks.find((item) => item.id === packId);
    if (!pack) return;

    if (!walletReady || !walletToken) {
      setShopNotice(walletUnavailableMessage);
      return;
    }

    try {
      const response = await fetch('/api/payments/robokassa/create-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${walletToken}`,
        },
        body: JSON.stringify({ packId, returnUrl: window.location.href }),
      });

      const payload = await response.json().catch(() => ({})) as { paymentUrl?: string };
      if (response.ok && payload.paymentUrl) {
        onPackCheckout(packId);
        window.localStorage.setItem(PAYMENT_RETURN_TO_GAME_KEY, '1');
        window.location.assign(payload.paymentUrl);
        return;
      }
    } catch {
      // Fallback to direct provider link if backend invoice is temporarily unavailable.
    }

    if (pack.url) {
      window.open(pack.url, '_blank', 'noopener,noreferrer');
      onPackCheckout(packId);
      return;
    }

    setShopNotice(shopPackUnavailableMessage);
  }, [coinPacks, onPackCheckout, shopPackUnavailableMessage, walletReady, walletToken, walletUnavailableMessage]);

  useEffect(() => {
    let isDisposed = false;
    if (walletInitInFlightRef.current) return;

    walletInitInFlightRef.current = true;

    const initWallet = async () => {
      try {
        const savedToken = localStorage.getItem(WALLET_TOKEN_KEY) || '';
        const response = await fetch('/api/session/init', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(savedToken ? { token: savedToken } : {}),
        });

        if (!response.ok) {
          throw new Error('wallet_init_failed');
        }

        const payload = await response.json() as { token?: string; balance?: number; playerId?: string };
        if (isDisposed) return;

        if (payload.token) {
          setWalletToken(payload.token);
          localStorage.setItem(WALLET_TOKEN_KEY, payload.token);
        }

        if (typeof payload.balance === 'number' && Number.isFinite(payload.balance)) {
          setSpaceCoins(Math.max(0, Math.floor(payload.balance)));
        }

        if (payload.playerId) {
          setPlayerId(String(payload.playerId));
        }

        setWalletReady(Boolean(payload.token));
      } catch {
        if (isDisposed) return;
        setWalletReady(false);
        setShopNotice(walletUnavailableMessage);
      } finally {
        walletInitInFlightRef.current = false;
      }
    };

    void initWallet();

    return () => {
      isDisposed = true;
    };
  }, [walletUnavailableMessage]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const paymentState = url.searchParams.get('payment');
    if (!paymentState) return;
    if (paymentState === 'success' && !walletToken) return;

    if (paymentState === 'success') {
      setShopNotice(language === 'ru' ? 'Платеж принят, зачисляем монеты...' : 'Payment received, crediting coins...');
      void syncWalletBalance();
      onPaymentStatus('success');
    } else if (paymentState === 'fail') {
      setShopNotice(language === 'ru' ? 'Платеж не завершен' : 'Payment was not completed');
      onPaymentStatus('fail');
    }

    url.searchParams.delete('payment');
    url.searchParams.delete('orderId');
    window.localStorage.removeItem(PAYMENT_RETURN_TO_GAME_KEY);
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }, [language, onPaymentStatus, syncWalletBalance, walletToken]);

  return {
    buyCoinsPack,
    playerId,
    setShopNotice,
    shopNotice,
    spaceCoins,
    spendCoins,
    syncWalletBalance,
  };
}
