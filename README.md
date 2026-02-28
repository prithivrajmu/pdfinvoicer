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

To run this project locally, you need the [Doppler CLI](https://docs.doppler.com/docs/install-cli) installed for secrets management.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/prithivrajmu/pdfinvoicer.git
   cd pdfinvoicer
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Authenticate Doppler:**
   ```bash
   doppler login
   # This will open a browser window to authenticate
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   *Note: This automatically fetches the `dev` environment secrets from Doppler and starts the Vite server.*

## Deployment Instructions

Deployments are handled via Firebase Hosting and secrets are injected during the build step using Doppler.

1. **Ensure you are authenticated:**
   ```bash
   doppler login
   npx firebase login
   ```

2. **Deploy to Production:**
   ```bash
   npm run deploy
   ```
   *This command fetches the `prd` secrets from Doppler, builds the production bundle, and deploys the `dist` folder to Firebase Hosting.*

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
