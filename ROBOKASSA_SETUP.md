# Robokassa Setup Checklist

## 1) Env configuration

Fill backend envs:

- `API_AUTH_SECRET`
- `PUBLIC_BASE_URL` (public backend URL, HTTPS)
- `ROBOKASSA_MERCHANT_LOGIN`
- `ROBOKASSA_PASSWORD1`
- `ROBOKASSA_PASSWORD2`
- `ROBOKASSA_IS_TEST=1` (for test mode)
- `ROBOKASSA_SUCCESS_URL=https://your-game-domain/?payment=success`
- `ROBOKASSA_FAIL_URL=https://your-game-domain/?payment=fail`
- `CORS_ALLOWED_ORIGINS=https://your-game-domain`

Optional:

- `SHOP_PACKS_JSON`
- `ROBOKASSA_CULTURE=ru`

## 2) Robokassa cabinet

Set these URLs in merchant settings:

- `Result URL`: `https://your-backend-domain/api/payments/robokassa/result`
- `Success URL`: `https://your-game-domain/?payment=success`
- `Fail URL`: `https://your-game-domain/?payment=fail`

## 3) Local test

1. Start backend: `npm run server`
2. Start frontend: `npm run dev`
3. Open game, open shop, click coin pack.
4. Ensure redirect goes to Robokassa page.
5. Complete test payment.
6. Return to game URL with `?payment=success`.
7. Check balance updated in UI.

## 3.1) Moderation content checklist

On your public game page make sure legal block contains:

- public offer,
- privacy policy,
- refund policy,
- support email and phone,
- seller requisites: name, INN, OGRN/OGRNIP, legal/postal address.

## 4) Production smoke test

1. Real payment with minimum pack.
2. Verify one webhook call credits exactly once.
3. Retry webhook from provider side and verify idempotency (no double credit).
4. Verify failed payment does not credit coins.
