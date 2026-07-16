# ♞ The Jaipuria Gambit

A fake-money betting app for an office chess tournament. Bet **J-Coins** (play money) on live matches, watch the crowd move the odds, back a champion early, and climb the leaderboard. Built in one afternoon for the Seth M.R. Jaipuria Schools internal 20-player bracket.

**Live:** https://jaipuria-gambit.vercel.app

## What makes it tick

- **Pari-mutuel odds.** No house, no bookie. Everyone's bets go into a pool and the crowd sets the odds live — back the underdog and a small stake can scoop the whole pot. Self-balancing and fair (if nobody backs the winner, everyone's refunded).
- **Champion futures.** A separate pool to bet who lifts the trophy. Money on knocked-out players stays in the pot as dead money, so early gutsy calls pay the fattest.
- **Auto-advancing bracket.** Later matches are stored as references (`winner:M2`). When an admin declares a result, the winner flows into the next round automatically, the loser is eliminated, and payouts settle in one transaction. No spreadsheets.
- **Claim-your-name auth.** Name + a PIN, everyone starts with 1,00,000 J-Coins. Zero-friction for a same-day office launch (scrypt-hashed PIN + a signed session cookie).
- **Live everything.** Moving odds, an activity ticker ("⚡ UPSET — …"), a leaderboard with chess-rank titles, all polled in near-real-time.

## Stack

Next.js 16 (App Router, React 19) · Tailwind v4 · `postgres.js` over Supabase's transaction pooler · deployed on Vercel (co-located with the DB region for latency).

All money logic is server-authoritative (server actions + Postgres transactions with row locks); the pari-mutuel math is a small pure module (`lib/parimutuel.ts`) with unit + integration tests behind it.

## Running it yourself

```bash
npm install
cp .env.example .env.local   # fill in your Postgres pooler creds + a SESSION_SECRET
npm run dev
```

Env vars (see `.env.example`): `PGHOST` `PGPORT` `PGUSER` `PGPASSWORD` `PGDATABASE` `SESSION_SECRET`. Everything lives in a single `gambit` Postgres schema; seed 20 players + 19 matches and you're live.

## Notes

Play money only — no real currency, no payments. A weekend-scale project, shared for the fun of it.
