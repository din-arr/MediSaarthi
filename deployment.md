# MediSaarthi — Deployment

- **GitHub:** https://github.com/din-arr/MediSaarthi
- **Live:** https://medi-saarthi-smoky.vercel.app
- **Demo video:** https://youtu.be/cCqMJQOMDgo
- **Hosting:** Vercel (Next.js app) + Neon (managed PostgreSQL, Singapore region)

## Demo logins

The OTP is shown on screen (test mode, no real SMS). The login screen also has one-tap demo buttons.

| Phone | Role |
|---|---|
| 9000000001 | Customer |
| 9000000002 | Pharmacist (registration no. WB-PH-21487) |
| 9000000005 | Store staff (Salt Lake store) |
| 9000000006 | Operations (dashboard + view-only store board) |

## Environment variables

| Name | Required | What it is |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string (Neon, **direct / non-pooled**) — or `file:./dev.db` for local SQLite |
| `AUTH_SECRET` | Yes | Long random string used to sign session cookies |
| `PRESCRIPTION_KEY` | Yes | Base64 32-byte key for AES-256-GCM prescription encryption (`openssl rand -base64 32`) |
| `OPENAI_API_KEY` | No | Enables real AI reading of prescriptions; without it a low-confidence demo draft is used |
| `OPENAI_MODEL` | No | Defaults to `gpt-4o-mini` |
| `OTP_PROVIDER` | No | `mock` (default, code shown on screen) or `firebase` (needs the `FIREBASE_*` variables) |
| `PRESCRIPTION_STORAGE` | No | Default stores encrypted files in the database; `disk` writes them to `/uploads` (self-hosting only) |
| `DEMO_FRESH_ORDERS` | No | Set to `off` to stop the three seeded demo orders being shown as freshly placed |
| `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_SUPPORT_WHATSAPP` | No | Support contact shown in the app |

Secrets are only set in the Vercel dashboard (and a local `.env`, which is git-ignored). Nothing secret is committed.

## Deploy to Vercel + Neon

1. **Database.** Create a project on [neon.tech](https://neon.tech) (region: Singapore, closest to Kolkata). Click **Connect**, turn **Connection pooling off**, and copy the connection string.
2. **Secrets.** Run `openssl rand -base64 32` twice: one value for `AUTH_SECRET`, one for `PRESCRIPTION_KEY`.
3. **Project.** On [vercel.com](https://vercel.com): **Add New → Project → Import** `din-arr/MediSaarthi`. Framework is detected as Next.js; keep the default build settings.
4. **Variables.** In **Settings → Environment Variables** add `DATABASE_URL`, `AUTH_SECRET` and `PRESCRIPTION_KEY` (Production).
5. **Deploy.** Push to `main` (or **Deployments → Redeploy**). Every push to `main` deploys to production automatically.

### What the build does

`npm run build` runs:

1. `scripts/generate-medicine-images.mjs` — maps available medicine images.
2. `scripts/prepare-db.mjs`:
   - if `DATABASE_URL` is Postgres, switches the Prisma provider to `postgresql`;
   - `prisma generate` and `prisma db push` (creates/updates tables);
   - seeds demo data **only if** the seed has never finished (checked via the `RuleConfig` table, which the seed writes last). The seed clears old rows first, so an interrupted seed is simply redone. Rows are inserted in batches, so seeding takes seconds.
3. `next build`.

With a local SQLite `DATABASE_URL`, step 2 only runs `prisma generate`.

## Run locally

```bash
npm install
cp .env.example .env          # set AUTH_SECRET and PRESCRIPTION_KEY
npx prisma migrate dev
npm run db:seed
npm run dev                   # http://localhost:3000
```

## Checks (CI)

GitHub Actions (`.github/workflows/ci.yml`) runs on every push and pull request:

```bash
npm ci
npx prisma generate
npm run lint
npm run typecheck
npm test        # 104 unit + integration tests; fails if coverage < 90%
```

## Operations

- **Daily stock:** `npm run stock:import -- data/stock-YYYY-MM-DD.csv` (columns `store_code,product_code,qty`).
- **Refill reminders:** `npm run reminders`, or **Run now** on the operations dashboard. In production this would run daily (e.g. Vercel Cron).
- **H1 register:** operations dashboard → **Download CSV** (last 90 days).
- **Logs:** Vercel project → **Logs** for runtime errors; **Deployments → Build Logs** for build errors.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Build stuck or failing at `prisma db push` | Use Neon's direct (non-pooled) connection string |
| Login says "Failed to execute 'json'" | Check Vercel **Logs** for `/api/auth/otp`; usually a missing environment variable |
| Prescription can't be opened | `PRESCRIPTION_KEY` changed after upload — files encrypted with the old key can't be read |
| Want a clean demo | Clear the database in Neon and redeploy; the seed runs again |
