# PDF Invoicer

PDF Invoicer is an offline-first GST invoice system built for small businesses that need dependable invoicing without turning their day-to-day workflow into a SaaS dependency.

The product is designed around three constraints:

- the app should still work without internet
- business data should stay local by default
- backups and authentication should be optional layers, not prerequisites for invoicing

## What It Does

- creates GST-compliant invoices with CGST, SGST, IGST, and HSN or SAC handling
- stores invoices, customers, and seller details locally using IndexedDB
- works in offline mode when Firebase configuration is not present
- supports Google and email or password sign-in when auth is enabled
- offers optional Google Drive backup for user-owned recovery
- ships as a PWA for desktop and mobile installation

## Live App

[app.ishvaryahospitality.com](https://app.ishvaryahospitality.com)

## Why It Exists

A lot of invoicing tools assume permanent connectivity, server-side data ownership, and recurring payment logic from the start. This project takes a different position: keep the invoicing workflow reliable on the device first, then layer backup and identity on top where they are useful.

That makes it a practical product for small teams that care about privacy, continuity, and low operational overhead.

## Stack

- React
- TypeScript
- Vite
- Zustand
- Dexie.js / IndexedDB
- Firebase Authentication
- Google Drive API
- jsPDF
- PWA via `vite-plugin-pwa`

## Local Development

### Fastest path: local offline mode

```bash
git clone https://github.com/prithivrajmu/pdfinvoicer.git
cd pdfinvoicer
npm install
npm run dev:local
```

This starts the app without Doppler. If Firebase environment variables are missing, the app still works in offline mode with local persistence.

### Optional Firebase setup

```bash
cp .env.example .env
```

Fill in your Firebase configuration if you want authentication and Google Drive backup enabled locally.

### Maintainer flow with Doppler

```bash
doppler login
doppler setup
npm run dev
```

## Commands

| Command | Purpose |
|---|---|
| `npm run dev:local` | Run locally using `.env` values or offline mode |
| `npm run dev` | Run locally with Doppler secrets |
| `npm run build:local` | Local production build |
| `npm run build` | Production build with Doppler |
| `npm run deploy` | Production build and Firebase Hosting deploy |
| `npm run test` | Run tests |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build |

## Deployment

The app is deployed on Firebase Hosting. Production secrets are injected through Doppler.

```bash
doppler login
npx firebase login
npm run deploy
```

## Architecture

The architecture is documented in [ARCHITECTURE.md](./ARCHITECTURE.md). At a high level:

- the client owns business logic and PDF generation
- IndexedDB is the primary data store
- Firebase handles identity when configured
- Google Drive backup is optional and user-owned
- the product remains usable even when those hosted services are unavailable

## Notes

- This repo is intentionally optimized around reliability and low recurring cost, not around a backend-heavy architecture.
- Offline mode is a real operating mode, not a degraded placeholder.
