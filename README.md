# Texas United Mortgage · Borrower Portal (prototype)

A redesigned borrower rate portal: React + Vite, mobile-first, no backend. All rates, reviews and contact details are sample data in `src/lib.ts`.

## Run locally
```bash
npm install
npm run dev
```

## Deploy to Vercel
**Option A – CLI (fastest)**
```bash
npm install
npx vercel        # log in, accept defaults (Vercel detects Vite)
npx vercel --prod
```

**Option B – GitHub**
Push this folder to a GitHub repo, then in Vercel choose *Add New → Project → Import*. Framework preset: **Vite**. Build command `npm run build`, output `dist`. No env vars needed.

## Where things live
| File | What it holds |
|---|---|
| `src/lib.ts` | Borrower, loan officer, reviews, base rate sheet and the pricing engine (payments, APR, credit/LTV adjustments, break-even, cost over time) |
| `src/components/sections.tsx` | Header, rate hero, rate explorer, loan officer card, reviews, footer, sticky action bar |
| `src/components/sheets.tsx` | Edit details, Schedule a call, Apply, Compare |
| `src/styles.css` | Design tokens (brand navy `#233B86`, red `#EA2523`, DM Serif Display + Poppins) and all styles |

`npm run build:single` also produces `dist-single/index.html`, a single self-contained file for quick sharing.

Not included yet (by request): AI advisor, rate-alert subscription.
