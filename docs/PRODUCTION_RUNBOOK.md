# KATHA production runbook

## Platform and recovery

- Production runs on Cloudflare Workers through Sites, with `DB` (D1) and `BUCKET` (R2) bindings declared in `.openai/hosting.json`.
- Every schema change is a numbered SQL file in `drizzle/` and is packaged with the Worker deployment.
- D1 Time Travel is automatically enabled by Cloudflare. Retention is 7 days on Workers Free and 30 days on Workers Paid.
- Before a risky data change, record a current Time Travel bookmark from the Cloudflare dashboard or with `wrangler d1 time-travel info <database>`.
- A restore overwrites the live database. Record the pre-restore bookmark and require an owner-approved maintenance window before running `wrangler d1 time-travel restore`.

## Cashfree production setup

Configure these as production runtime variables in Sites; never commit them:

- `CASHFREE_APP_ID` — secret
- `CASHFREE_SECRET_KEY` — secret
- `CASHFREE_ENV=production`
- `CASHFREE_API_VERSION=2025-01-01`
- `RATE_LIMIT_SALT` — secret random value
- `ADMIN_EMAIL=yashpatel9724945@gmail.com`

Cashfree webhook URL:

`https://katha-ethnic-wear.yashpatel9724945.chatgpt.site/api/payments/cashfree/webhook`

The webhook handler verifies `x-webhook-signature` against the exact raw request body and timestamp, checks INR amounts against D1, and stores a unique payment event before applying an idempotent order update.

## Monitoring

- Cloudflare Worker logs contain structured `katha-storefront` events for 5xx exceptions, requests slower than two seconds, rate limiting, payment failures, and webhook processing.
- Every response includes `x-request-id`; use it to correlate a customer report with Worker logs.
- Watch request count, error rate, CPU time, duration, D1 rows read/written, R2 operations, `rate_limited`, `cashfree_create_failed`, and `request_failed` events.
- Alert on sustained 5xx > 1%, p95 duration > 2 seconds, any webhook signature rejection spike, or payment orders pending longer than 15 minutes.

## Incident checklist

1. Disable online payment in the UI or unset Cashfree credentials if payment state is inconsistent; COD remains available.
2. Find the request ID and inspect Worker logs.
3. Compare the local order, Cashfree order status, and latest `payment_events` row.
4. Never mark an order paid from browser data. Confirm with Cashfree server API or a verified webhook.
5. Use D1 Time Travel only after identifying the exact safe timestamp/bookmark.

References: Cloudflare D1 Time Travel, Cloudflare Worker Observability, Cloudflare Rate Limiting API, and Cashfree Payment Gateway webhook verification documentation.
