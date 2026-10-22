# Project context: Texas United Mortgage borrower portal

Read this first. It is the handoff doc so a new session (e.g. Claude Code in a terminal) can pick up exactly where the last one stopped.

## What this is

A clickable **prototype** of a redesigned borrower rate portal for **Texas United Mortgage** (Houston / Spring, TX). It replaces a dated rate dashboard (the source was a FiveStar Home Loans demo at `dashboard.fivestar.mortgage/my-subscription-dashboard`) with a high-end, SaaS-style, mobile-first experience.

- **Owner:** Sreeni (sreeni@bankingbridge.com). Runs **limesite** (limesite.io), which builds conversion-focused sites for US mortgage brokers. Sreeni is a designer and does not write front-end code, so explain changes in plain language and do the coding yourself.
- **Client:** Texas United Mortgage. Loan officer shown in the portal: **Richard Haskell**.
- **Status:** prototype. No backend, no auth, sample rate data. Real data in the UI: Richard's details and photo, Texas United's Google rating and review excerpts, the apply link.

## Links

| What | Where |
|---|---|
| Live site (production) | https://texas-united-borrower-portal.vercel.app |
| GitHub repo (private) | https://github.com/jcsreenivasan/texas-united-borrower-portal |
| Vercel project | Personal Hobby account `jcsreenivasans-projects` → project `texas-united-borrower-portal`. Git-connected: every push to `main` deploys production; other branches get preview URLs. |
| Apply link (all "Apply" CTAs) | https://richard.my1003app.com/register (opens in a new tab) |
| Google reviews | https://maps.app.goo.gl/4YiicHBNwjBKKsMPA (Texas United Mortgage, 2170 Buckthorne Pl Ste 200, Spring, TX 77380) |
| Brand source | https://www.texasunitedmortgage.com |
| Limesite (footer credit) | https://www.limesite.io/ |

## Stack and commands

- Vite 5 + React 18 + TypeScript (strict, `noUnusedLocals`). Icons: `lucide-react`. Styling: one hand-written CSS file with tokens, no Tailwind.
- `npm install` → `npm run dev` (local) → `npm run build` (runs `tsc --noEmit` then `vite build`, output `dist/`). **The Vercel build fails on any TS error, including unused imports.**
- `npm run build:single` → `dist-single/index.html`, one self-contained file (vite-plugin-singlefile) for sharing a preview without hosting.
- Vercel settings: framework preset Vite, defaults, no env vars.

## File map

```
index.html                  Google Fonts (DM Serif Display + Poppins), title, favicon
public/favicon.png          Texas map mark cropped from the logo
src/main.tsx                React entry
src/App.tsx                 Page state (scenario, term, horizon, sort, selected/compare rates, toasts) and layout
src/lib.ts                  ALL data + pricing engine (borrower, officer, reviews, URLs, rate sheet, math, formatting)
src/styles.css              Design tokens (:root) + every style; responsive breakpoints 1080 / 860 / 720 / 380
src/components/ui.tsx       Primitives: Sheet (modal/bottom sheet), Segmented, Field, MoneyInput, Toggle, Stars, Toast, LoneStar, ApplyLink, useTween
src/components/sections.tsx Header (+ account menu), Hero, RateExplorer, OfficerCard, Reviews, Footer, ActionBar, CompareTray
src/components/sheets.tsx   ScenarioForm (inline loan-details form), CompareSheet (side-by-side rate comparison)
src/assets/                 tum-logo.png, richard-haskell.jpg (144px), equal-housing.png
```

To change content, edit `src/lib.ts` first: names, NMLS, phone, email, reviews, URLs, default scenario.

## Page anatomy (top to bottom)

1. **Top bar:** logo · "Borrower portal" · Schedule a call · account button ("Reef"). The account button opens a menu with **Log out**, which only shows a toast ("Prototype: this would sign you out.").
2. **Greeting:** "Good morning/afternoon/evening, Reef." plus a one-line subtitle.
3. **Hero (navy quote card):** selected rate (defaults to the lowest available), APR · term · loan type, monthly P&I, points at closing, rates-as-of, four stats (loan amount, credit, loan type, property), CTAs: **Apply now** (primary, red), **Schedule a call** (secondary), "Edit my details" (anchor to `#details`).
4. **Your rates, on demand:**
   - **Inline loan details form** (`ScenarioForm`, `#details`), always visible. Edits stay local until **Update rates** is clicked. A "Changes not applied yet" pill shows pending edits. Reset restores the defaults.
   - Term tabs: 30, 20, 15-yr fixed; 10/6, 7/6, 5/6 ARM.
   - "How long do you plan to keep this loan?" 3/5/7/10 yrs: drives the "Cost over N yrs" column and the "Best value" tag.
   - Toggles: Waive escrows (+0.25 pts), Show total payment (adds est. taxes, insurance, MI). Sort: lowest rate, lowest upfront cost, best value.
   - Rate rows: tags (Lowest rate, Best value · N yrs, Lowest closing cost, Selected). Click a row to expand the payment breakdown, explanation and break-even, plus "Select this rate" and "Apply with this rate".
   - Compare checkboxes (max 3, can span terms) → floating tray → Compare modal.
   - "Not sure which option fits?" card with Schedule a call.
5. **Loan officer card:** right column, **sticky** on desktop (`.col-side { align-self: stretch }` is what makes sticky work). On ≤1080px it moves inline below the rates. Shows photo, Richard Haskell, Loan Officer · NMLS #347720, ★ 4.9 (151 Google reviews), phone 346-229-1950, team@texasunitedmortgage.com, Apply now, Schedule a call.
6. **What borrowers say:** Google only. 4.9, 151 reviews, "Read all reviews on Google" link, four review cards.
7. **Footer:** logo, Equal Housing Opportunity logo (client-supplied), prototype disclaimer, animated **"Made with Limesite.io"** pill (lime shimmer text + pulsing dot) linking to limesite.io in a new tab.
8. **Sticky action bar:** appears once the hero scrolls out of view. Full-width bottom bar on phones (Schedule a call + Apply now), floating pill on desktop.

## Behaviour rules (agreed with Sreeni)

- **Every "Apply" CTA** is an `<a>` to `APPLY_URL` with `target="_blank" rel="noopener noreferrer"` (use the `ApplyLink` component). No apply modal.
- **"Schedule a call" does nothing for now.** It is wired to the `scheduleCall` no-op in `App.tsx`. The old scheduling modal was removed on request. The client will provide a booking link later: wire it there (open in a new tab).
- Primary CTA = Apply now (red). Secondary = Schedule a call (outline / on-dark).
- Out of scope until asked: **AI advisor** and **rate-alert subscription** (both existed on the source dashboard).

## Data and pricing engine (`src/lib.ts`)

- **Base 30-yr rate sheet** copied from the source dashboard (rate, points, APR), e.g. 6.875% / 7.062% APR / 1.875 pts at $360k, 780 FICO, 20% down. Default scenario: purchase, ZIP 33130 Miami FL, $450k price, $90k down, 780, single family, primary, conventional, $12k/mo income, first-time buyer.
- Other terms apply rate deltas (20-yr −0.125, 15-yr −0.625, ARMs −0.25/−0.375/−0.5). FHA −0.375, VA −0.5.
- Points adjustments (LLPA-style) for credit score, LTV, condo/2–4 unit, second home/investment, refinance, waived escrow.
- APR is solved numerically, then calibrated so the default scenario reproduces the source APRs exactly.
- Taxes and insurance are estimated per ZIP (`ZIPS` table: Miami plus Houston, Katy, Austin, Dallas, San Antonio; other 5-digit ZIPs fall back to generic Texas rates). Conventional PMI applies above 80% LTV, FHA MIP always.
- "Cost over N yrs" = interest paid over N years + points (minus credits). Break-even = extra upfront cost ÷ monthly savings vs. the near-par option.
- **Monthly income** is still collected (the source form had it) but no longer affects anything. The affordability meter that used it was removed on request. Ask Sreeni whether to drop the field.

## Design system

- Colors from texasunitedmortgage.com: navy `#233B86`, red `#EA2523`, blue `#01549D`. Ink `#121A33`, background `#F4F6FB`, lines `#E3E7F1`. Semantic green, amber and red. Tokens live at the top of `styles.css`.
- Type: **DM Serif Display** for big numbers and headings (matches the serif logo), **Poppins** for UI. Tabular numerals.
- Motifs: a faint Texas lone-star in the hero; a red rule before light eyebrows (echoes the logo's "— MORTGAGE —" rules).
- Radii 10/12/18/22. Light theme only (deliberate).
- Quality bar: "high-end SaaS product designer", intuitive, **mobile-optimized**. Check every change at **1440×900 and 390×844** (Playwright works well) and keep the page free of horizontal scroll on mobile.

## Reviews data

- Pulled Oct 22, 2026 from Google Maps while signed out. Google's limited view only exposes about 4 reviews as excerpts, so some cards end in "…". Rating **4.9**, **151** reviews.
- Reviewers: Nelson Vargas (mentions Richard Haskell), Richie milano, Ishu Sahni, Coy Stephenson. Two reviews praise "Reef". Reef Merhi appears to be Texas United's founder/president, and the prototype borrower is also named "Reef" by Sreeni's request. Worth flagging if the client finds that confusing.
- For full, live reviews later: Google Places API (Place Details → reviews, max 5) or the Google Business Profile API with the client's access.

## Change log (requests so far)

1. Built the portal from the source dashboard: Texas United branding, Apply primary CTA, Schedule a call secondary. AI advisor and rate alerts skipped.
2. Created the private GitHub repo and Vercel project; production URL live.
3. Borrower renamed Jimmy → **Reef**. Loan officer → **Richard Haskell** (NMLS 347720, 346-229-1950, team@texasunitedmortgage.com) with photo. Removed the "Saves $X/mo vs. low-cost option" line. New greeting subtitle. Removed the housing-cost-vs-income meter.
4. Loan details are always visible inline with an **Update rates** button (replaced the edit modal). Officer card sticky. Reviews switched to Google only (real data). Subtitle on one line. Real Equal Housing logo. "Made with Limesite.io" animated credit. Account menu with Log out. All Apply CTAs go to the my1003app register link. Schedule-a-call modal removed (button is a no-op). This file added.

## Open items / ideas

- Booking link for **Schedule a call** (waiting on the client).
- Default ZIP is Miami (from the source data). Switch to a Texas ZIP (e.g. 77380 Spring), which needs adding to `ZIPS`.
- Real rate feed / pricing API instead of the sample rate sheet. Real borrower auth and log out.
- Full Google review text (see Reviews data).
- Vercel deployment-specific URLs may require a Vercel login; share the production URL.

## How changes were shipped so far (and how to do it better)

- GitHub was **not** linked to Claude in the original cloud session, so commits were made through the GitHub web editor in Sreeni's Chrome, one file per commit. Some intermediate Vercel builds failed while files were half-updated; production only moves on successful builds.
- In Claude Code with git access: `git clone https://github.com/jcsreenivasan/texas-united-borrower-portal`, make the change, run `npm run build` (must pass), then commit and push to `main`. Vercel deploys production automatically in about a minute. Use a branch if Sreeni wants a preview URL first.
- Local git history in the old cloud session differs from GitHub's. **GitHub `main` is the source of truth.**
