# KATHA Ethnic Wear

The existing KATHA ecommerce storefront, catalog, cart, COD checkout, order tracking and owner admin source. White, responsive storefront with supplied product photography and responsive WebP assets.

Repository: https://github.com/mspatel1111/katha-

## Install on your laptop (Windows PowerShell)

Install Git and Node.js **22.13 or newer in the Node 22 release line**, including npm. Open a new PowerShell window after installation. No Bash, Python or global Wrangler installation is needed for laptop setup.

```powershell
git clone https://github.com/mspatel1111/katha-.git
cd katha-
node --version
npm --version
npm ci
npm run db:local
npm run dev
```

Open the exact localhost URL printed by Vite (normally http://127.0.0.1:5173). If the port is occupied, Vite selects another port. Stop the server with Ctrl+C. If PowerShell blocks npm.ps1, use `npm.cmd` instead of `npm`; no security-policy change is required.

`db:local` applies all eight existing migrations to the **local** D1 emulator. Run it again after pulling new migrations; already applied files are not replayed. It cannot take a --remote flag. Local D1/R2 state lives under ignored .wrangler/state/v3; no Cloudflare login is needed for local use. Existing catalog defaults initialize on the first catalog request.

macOS/Linux use the same clone, npm ci, npm run db:local, and npm run dev commands. The managed Sites Linux host retains its own bounded installation/build helpers.

## Verify and preview a build

```powershell
npm run typecheck
npm run lint
npm test
npm start
```

`npm test` builds and runs the test suite serially with disposable test databases. It does not contact production or place real orders. `npm start` previews the compiled Worker using the local Cloudflare runtime (normally http://127.0.0.1:4173); it is **not** a production deployment. Run `npm run build` before npm start if you have not run npm test.

## Update your laptop copy

Stop the local server, preserve any local edits, then:

```powershell
git pull --ff-only
npm ci
npm run db:local
npm run dev
```

## Admin access and hosting: important

The current hosted /admin uses **Sites-managed, trusted sign-in identity**, restricted by ADMIN_EMAIL (current fallback owner: yashpatel9724945@gmail.com). There is no admin password in this repository. A GitHub login/email is unrelated to the website admin identity.

Local preview does not provide the Sites sign-in gateway; ordinary local requests cannot log into the owner admin. It is for storefront/development verification only. Servers bind to 127.0.0.1 by default. Never expose the raw local Worker publicly or trust user-supplied oai-authenticated-* headers as authentication.

GitHub stores the **source**, not the running shop. GitHub Pages cannot run this full-stack Worker/D1/R2 project. Uploading or pulling this repo does not change the existing live site or its owner-only access. .openai/hosting.json preserves the existing Sites project identity and logical DB/BUCKET bindings; Sites owns production resource wiring.

Do not deploy this unchanged raw Worker to a standalone Cloudflare account: it first needs an independently verified authentication gateway that strips client identity headers, validates signed identity server-side, and restricts the owner. It also needs real D1/R2 resources, production migrations/backups, secret configuration and operational verification. wrangler.local.jsonc has local placeholders only; **do not use it to deploy or migrate remotely**.

## Configuration and payments

For optional local Worker variables, copy .dev.vars.example to .dev.vars. The ignored file may contain local secrets; never upload it. Hosted values must be configured in the hosting platform, not committed to GitHub.

COD is the default checkout path. Online Cashfree checkout remains disabled unless **both** verified credentials and CASHFREE_CHECKOUT_ENABLED=true exist. Do not enable real payments until sandbox and production return/webhook/signature/refund/reconciliation flows are verified against the intended domain. Do not paste credentials into GitHub or chat.

The repo includes source and static product assets, but **not** the live D1 database, orders/customer data, production R2 uploads or secrets. A new local database will not show production orders. The 100 draft product concepts are inactive, zero-price/zero-stock reference drafts until the owner adds accurate details and publishes them.

## Project layout

| Location | Purpose |
| --- | --- |
| app/ | Storefront, product, checkout, tracking, admin UI and API routes |
| lib/ | Catalog, stock/order protection, settings, validation, payment helpers |
| db/, drizzle/ | Schema and eight additive SQL migrations |
| worker/index.ts | Cloudflare Worker, caching and structured request logs |
| public/images/ | Ready-to-use responsive WebP product assets |
| assets/originals/ | Supplied high-resolution originals (not served to customers) |
| tests/ | Unit/integration/regression checks with isolated D1/R2 |
| .openai/hosting.json | Existing Sites project/binding metadata, not credentials |

For schema development only: `npm run db:generate` generates a new migration. Review generated SQL before applying; never rewrite already applied production migrations.

## Current limitations

Local tests do not prove capacity for 100,000 simultaneous customers. Production deployment, authenticated admin verification, backups/restore drills, payment verification and an authorized load test are separate release gates. See IMPLEMENTATION_REPORT.md for implementation and QA context. This source handoff does not claim that previously unpushed changes are already deployed live.
