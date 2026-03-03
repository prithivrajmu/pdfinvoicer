# PDF Invoicer — GST Invoice Generator

A robust, offline-first invoice generator tailored for GST compliance. Built for small businesses and freelancers, this application prioritizes data privacy, offline capabilities, and zero-recurring-cost operations.

## Key Features

- **Offline-First**: Generate invoices even without internet access. Data is stored locally using IndexedDB.
- **Data Privacy**: No business data is sent to external servers by default.
- **Free Cloud Backups**: Built-in integration with Google Drive allows users to back up their data securely to their personal accounts.
- **Authentication**: Secure Firebase Authentication (Google and Email/Password).
- **GST Compliant**: Built-in handling for CGST, SGST, IGST, and HSN/SAC codes.
- **PWA Ready**: Installable as a progressive web app on desktop and mobile.
- **Modern Tech Stack**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui.

## Live Demo

**[app.ishvaryahospitality.com](https://app.ishvaryahospitality.com)**

## Local Development Setup

### Quick Start (without Doppler)

The fastest way to run locally — no secrets manager needed. The app works in **offline mode** (no auth, data stored in IndexedDB).

1. **Clone the repository:**
   ```bash
   git clone https://github.com/prithivrajmu/pdfinvoicer.git
   cd pdfinvoicer
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **(Optional) Set up Firebase environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in your Firebase project credentials. If you skip this step, the app runs in offline mode without authentication or Google Drive backup.

4. **Start the development server:**
   ```bash
   npm run dev:local
   ```
   The app will be available at `http://localhost:5173/`.

### With Doppler (for project maintainers)

If you have access to the project's [Doppler](https://docs.doppler.com/docs/install-cli) secrets:

1. **Authenticate and link the project:**
   ```bash
   doppler login
   doppler setup          # Select project: pdfinvoicer, config: dev
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```
   This fetches the `dev` environment secrets from Doppler and starts the Vite server.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev:local` | Start dev server (reads `.env` file) |
| `npm run dev` | Start dev server via Doppler secrets |
| `npm run build:local` | Production build (reads `.env` file) |
| `npm run build` | Production build via Doppler secrets |
| `npm run deploy` | Build with `prd` secrets + deploy to Firebase Hosting |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |
| `npm run preview` | Preview the production build locally |

## Deployment Instructions

Deployments are handled via Firebase Hosting. Secrets are injected during the build step using Doppler.

1. **Ensure you are authenticated:**
   ```bash
   doppler login
   npx firebase login
   ```

2. **Deploy to Production:**
   ```bash
   npm run deploy
   ```
   This fetches the `prd` secrets from Doppler, builds the production bundle, and deploys the `dist` folder to Firebase Hosting.

### Adding a Custom Domain

To set up a custom domain (e.g., `app.example.com`):

1. Go to the [Firebase Console](https://console.firebase.google.com).
2. Navigate to **Hosting**.
3. Click **Add custom domain** and follow the DNS verification steps.
4. Go to **Authentication > Settings > Authorized domains** and add your new custom domain.
5. In the [Google Cloud Console](https://console.cloud.google.com), update your OAuth 2.0 Client ID to include the new custom domain in both **Authorized JavaScript origins** and **Authorized redirect URIs**.

## Architecture & Design

For a deep dive into the High-Level Design (HLD) and Low-Level Design (LLD), please read [ARCHITECTURE.md](./ARCHITECTURE.md).

## Tools Used

- **Framework**: React via Vite
- **Styling**: Tailwind CSS & shadcn/ui
- **State Management**: Zustand
- **Local DB**: Dexie.js (IndexedDB)
- **Auth & Hosting**: Firebase
- **PDF Generation**: jsPDF & html2canvas
- **Secrets Management**: Doppler
