# MediSaarthi

Medicine reordering for a Kolkata pharmacy chain (46 stores across Kolkata and Howrah). Customers reorder monthly medicines in a minute, a registered pharmacist checks every prescription, the nearest store with stock packs it, and customers get reminded before they run out.

> Independent educational demo. Payments, SMS/WhatsApp and outside systems are mocked. Don't upload real prescriptions.

## What's in it

| For | Screen | What it does |
|---|---|---|
| Customer | Home | Big reorder button, family switcher, "running low" reminders, latest order |
| Customer | Upload | Prescription upload, AI draft of the items, delivery address, nearest store |
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

### Demo logins (OTP is shown on screen in demo mode)

| Phone | Role | What you'll see |
|---|---|---|
| 9000000001 | Customer, Debasish Ghosh | Order for his mother, packed at Salt Lake |
| 9000000003 | Customer, Rina Sen | Telmisartan order waiting for a pharmacist |
| 9000000004 | Customer, Arif Mondal | Levothyroxine order needing a clearer photo |
| 9000000002 | Pharmacist, Ananya Roy (WB-PH-21487) | Queue, store orders, dashboard |

Seed data matches the client's sample orders RX-50211, RX-50214 and RX-50219.

### Useful scripts

```bash
npm run test:rules      # Schedule H/H1/X rules
npm run test:routing    # store routing
npm run stock:import -- data/stock-2026-11-03.csv   # daily stock CSV
npm run reminders       # send refill reminders (normally a daily job)
```

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
- **Refill reminders**: when a pharmacist approves, the run-out date is worked out as quantity × pack size ÷ tablets per day. The reminder job texts people 5 days before.

## The hard part: Schedule H blocking

All the rules live in `src/lib/pharmacy/rules.ts` and run **on the server** for every status change, including packing and dispatch at the store. Hiding a button isn't enough.

- **Schedule X / narcotics**: can't be added to an order at all.
- **Schedule H**: the order can't be approved, packed or dispatched until every item has a pharmacist's decision, the approver has a registration number, and the prescription is inside its validity window (180 days, configurable).
- **Schedule H1**: same, plus an H1 register entry (prescriber, registration no., patient, address, quantity, pharmacist) written in the same transaction as the approval.
- Rules are stored in a `RuleConfig` table, because online pharmacy rules in India aren't final.
- The dashboard checks every dispatched order and shows a red banner if any H/H1 item ever left without approval.

`tests/rules.test.ts` covers these cases.

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

- Cheaper generic suggestions with customer consent
- Real SMS/WhatsApp, payments and OTP providers (all mocked)
- Postgres + cloud file storage for deployment
