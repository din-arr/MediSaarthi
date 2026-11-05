# MediSaarthi

![CI](https://github.com/din-arr/MediSaarthi/actions/workflows/ci.yml/badge.svg)

Medicine reordering for a Kolkata pharmacy chain (46 stores across Kolkata and Howrah). Customers reorder monthly medicines in a minute, a registered pharmacist checks every prescription, the nearest store with stock packs it, and customers get reminded before they run out.

> Independent educational demo. Payments, SMS/WhatsApp and outside systems are mocked. Don't upload real prescriptions.

## Why it matters

The client loses about **₹1.33 crore a year**: 1,800 regular customers a month skip or buy elsewhere because nobody reminded them or their store was out of stock (₹85.5 lakh in margin), and staff spend 60 hours a day on WhatsApp orders (₹47.5 lakh).

| Client target | How MediSaarthi gets there |
|---|---|
| 30% of regular customers ordering online in 6 months | Reorder in a minute from the home screen; family profiles for people ordering for parents |
| Monthly drop-off from 20% to 10% | Refill reminders worked out from quantity and dosage, plus one-tap reorder; routing to the nearest store **with stock** |
| Median verification under 10 minutes | Oldest-first queue with waiting time, prescription beside the items, AI draft, keyboard shortcuts; median tracked on the dashboard |
| No Schedule H/H1 item dispatched without approval | Rules enforced on the server at every status change, tested, and checked live on the dashboard |

## What's in it

| For | Screen | What it does |
|---|---|---|
| Customer | Home | Big reorder button, family switcher, "running low" reminders, latest order |
| Customer | Upload | Prescription upload, AI draft of the items, delivery address, nearest store |
| Customer | Generic offer | Pharmacist suggests a cheaper generic; the customer accepts or keeps the brand |
| Customer | Search + cart | OTC medicines (paracetamol, ORS…) go straight to cart, no prescription or pharmacist wait |
| Customer | Order | Status timeline, pharmacist decisions, re-upload, UPI / cash on delivery |
| Pharmacist | Queue | Oldest first, waiting time, schedule, AI confidence |
| Pharmacist | Review | Prescription beside the items; approve, edit or reject with a reason |
| Store | Store orders | Pick checklist, store invoice number, handover to rider |
| Operations | Dashboard | Orders by store, median verification time, rejection reasons, Schedule H safety check |

Also: OTP login, family profiles, saved addresses, search, Bengali / Hindi / English, light and dark mode.

## Run it

```bash
npm install
cp .env.example .env          # then fill in AUTH_SECRET and PRESCRIPTION_KEY
openssl rand -base64 32       # use this for PRESCRIPTION_KEY
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open http://localhost:3000.

### Demo logins

On the login screen, tap a demo account button, or type a number below. The OTP is shown on screen (no real SMS).

| Phone | Role | What you'll see |
|---|---|---|
| 9000000001 | Customer, Debasish Ghosh | Order for his mother, packed at Salt Lake |
| 9000000003 | Customer, Rina Sen | Telmisartan order waiting for a pharmacist |
| 9000000004 | Customer, Arif Mondal | Levothyroxine order needing a clearer photo |
| 9000000002 | Pharmacist, Ananya Roy (WB-PH-21487) | Prescription queue and side-by-side verification |
| 9000000005 | Store staff, Sourav Das (Salt Lake) | Pick, pack, invoice and rider handover |
| 9000000006 | Ops, Priya Banerjee | Central dashboard for all 46 stores |

Seed data matches the client's sample orders RX-50211, RX-50214 and RX-50219.

### Useful scripts

```bash
npm test                # unit + integration tests, fails under 90% coverage
npm run test:fast       # same tests, no coverage gate
npm run test:rules      # Schedule H/H1/X rules only
npm run test:routing    # store routing
npm run stock:import -- data/stock-2026-11-03.csv   # daily stock CSV
npm run reminders       # send refill reminders (normally a daily job)
```

### Tests

- `tests/unit`: pure logic (Schedule rules, routing, matching, encryption, cart, proxy).
- `tests/integration`: every API route handler, run against a fresh SQLite database (`prisma/test.db`).
- Coverage covers `src/lib`, `src/app/api` and `src/proxy.ts`, with a minimum of 90% lines, branches and functions. CI runs it on every push and pull request.

## How it's built

```
Browser (customer phone / pharmacist desktop)
   │
Next.js app ── pages in src/app/**/page.tsx
   │          API in src/app/api/**/route.ts
   │
   ├─ Prisma ── SQLite locally (Postgres in production)
   ├─ Encrypted prescriptions in /uploads (AES-256-GCM)
   └─ Mock providers: OTP, payments, SMS/WhatsApp, AI reading
```

- **Routing** (`src/lib/routing.ts`): nearest open store within its delivery radius that has every item in today's stock. Falls back to the store with the most items and says what's missing. Stock is reserved when the order is placed and released if it's rejected.
- **Generics**: brand products link to their generic. The pharmacist can offer it; the order can't be approved until the customer accepts or declines (consent is logged).
- **Reorder**: reuses the earlier prescription while it's still valid, but goes through routing and a fresh pharmacist check like any new order.
- **Refill reminders**: when a pharmacist approves, the run-out date is worked out as quantity × pack size ÷ tablets per day. The reminder job texts people 5 days before.

## The hard part: Schedule H blocking

All the rules live in `src/lib/pharmacy/rules.ts` and run **on the server** for every status change, including packing and dispatch at the store. Hiding a button isn't enough.

- **Schedule X / narcotics**: can't be added to an order at all.
- **Schedule H**: the order can't be approved, packed or dispatched until every item has a pharmacist's decision, the approver has a registration number, and the prescription is inside its validity window (180 days, configurable).
- **Schedule H1**: same, plus an H1 register entry (prescriber, registration no., patient, address, quantity, pharmacist) written in the same transaction as the approval.
- Rules are stored in a `RuleConfig` table, because online pharmacy rules in India aren't final.
- The dashboard checks every dispatched order and shows a red banner if any H/H1 item ever left without approval.

`tests/unit/rules.test.ts` covers these cases.

## Privacy (DPDP Act 2023)

- Prescriptions are encrypted with AES-256-GCM before they touch the disk, and are only decrypted for pharmacists.
- Every view is written to `PrescriptionAccessLog`. Every approve, edit and reject is written to `AuditLog`, with before and after values.

## AI

AI only drafts. It reads the prescription and suggests products and quantities with a confidence score. Low confidence is highlighted for the pharmacist, unreadable prescriptions get a re-upload request, and a registered pharmacist decides every item. The app never gives medical advice.

## Design decisions

- **Calm and minimal**: one teal brand colour, status colours only where they mean something, 17px body text, a big reorder button. Customers are often worried, or ordering for a parent.
- **No chatbot**: the brief says the system must never give medical advice, and the client doesn't want clutter.
- **One login flow**: OTP works for both new and returning users, so no "do I have an account?" confusion.
- **Only Kolkata and Howrah**: that's where the 46 stores are. The service area is configurable.

## Not done yet

- Real SMS/WhatsApp, payments and OTP providers (all mocked)
- Postgres + cloud file storage for deployment

## Deploy (Vercel + Neon)

1. Create a free Postgres database on [Neon](https://neon.tech) and copy its connection string.
2. Import this repo on Vercel and add env vars: `DATABASE_URL` (Neon string), `SESSION_SECRET`, `PRESCRIPTION_KEY` (`openssl rand -base64 32`), optionally `OPENAI_API_KEY`.
3. Deploy. The build switches Prisma to Postgres, pushes the schema and seeds demo data on first run.

Prescriptions are stored encrypted inside the database, so nothing depends on Vercel's disk. Uploads are capped at 4 MB (Vercel's request limit).
