# Stripe Webhook Setup

This backend verifies Stripe webhooks with the raw request body and `STRIPE_WEBHOOK_SECRET`.

## Endpoint

```text
POST /api/payment/webhook
```

The server listens for:

- `checkout.session.completed`
- `customer.subscription.deleted`

## Local Test

```powershell
stripe login
stripe listen --forward-to localhost:5000/api/payment/webhook
```

Copy the webhook signing secret printed by Stripe CLI into `backend/.env` as `STRIPE_WEBHOOK_SECRET`.
Do not commit that value.

## Required Variables

```env
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
FRONTEND_URL=http://localhost:5173
```

Use `sk_test_...` for test mode. The frontend displays test/live mode from the backend and never receives the secret key.

## Notes

- Demo funding uses `/api/payment/demo-deposit` and is not a Stripe payment.
- Stripe Checkout deposits use `/api/payment/create-checkout-session` with `type=deposit`.
- Plan upgrades use `/api/payment/create-checkout-session` with `type=subscription`.
- If the webhook is not configured, the app can still verify a returned Checkout Session with Stripe, but webhook fulfillment is the recommended path.
