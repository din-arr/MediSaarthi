This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
## Database setup

Local development uses SQLite. Copy the example environment and create the database:

```bash
cp .env.example .env
```

Then create the schema and load the demo data:

```bash
npm run db:migrate -- --name init
npm run db:seed
```

The seed creates six Kolkata/Howrah stores, sample products and stock, the demo order for Debasish Ghosh (`9000000001`), pharmacist (`9000000002`), and Rina Sen (`9000000003`). Never commit `.env` or production credentials. To switch to PostgreSQL later, change the Prisma provider to `postgresql` and set `DATABASE_URL` to a PostgreSQL connection string.

### OTP providers

`OTP_PROVIDER=mock` is the default. It generates a random code, stores only its SHA-256 hash for five minutes, and returns the code in the UI demo banner. Requests are limited to three per phone per ten minutes and verification allows five attempts.

For Firebase, set `OTP_PROVIDER=firebase` plus `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`. Configure Firebase Authentication > Phone, enable invisible reCAPTCHA in the browser Firebase client flow, and add test phone numbers under Authentication > Sign-in method > Phone numbers for testing. The server verifies the resulting Firebase ID token with `firebase-admin`.

Prescription uploads require `PRESCRIPTION_KEY`, a base64-encoded 32-byte AES-256-GCM key. Generate one with `openssl rand -base64 32`; uploaded files are encrypted under `uploads/`, which is gitignored.

Set `OPENAI_API_KEY` optionally to enable image prescription drafting; without it the app uses seeded-product mock matches.
