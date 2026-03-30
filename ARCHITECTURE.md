# Architecture Document

This document describes the architecture of **PDF Invoicer**, an offline-first GST invoice system built to keep invoicing reliable on the client while minimizing backend cost and operational dependency.

## High-Level Design (HLD)

The application follows a **Thick Client / Serverless** architecture. Because the goal is zero recurring backend infrastructure costs, the application moves all business logic, data storage, and PDF generation to the client.

### Core Systems

1. **Client Application (React/Vite)**
   - The entire front-end application delivered as a Progressive Web App (PWA).
   - Responsible for rendering UI, handling business logic, calculating taxes, and generating the final PDF invoice.

2. **Authentication Provider (Firebase Auth)**
   - Provides Google OAuth and Email/Password sign-ins.
   - Issues JWTs and manages user sessions. 
   - Protects application routes.

3. **Local Storage Engine (IndexedDB via Dexie.js)**
   - Acts as the primary database for the application.
   - Stores invoices, customer data, and seller settings locally on the user's device.
   - Ensures the app functions entirely offline.

4. **Remote Backup Storage (Google Drive API)**
   - Since data is localized to the device, the app integrates with Google Drive.
   - Uses the `appDataFolder` scope to store an encrypted/hidden JSON backup of the user's IndexedDB data, ensuring data safety across devices without requiring us to host a database.

5. **Secrets Management (Doppler)**
   - Used during the CI/CD and local development phases to securely inject environment variables (Firebase config, Google Client IDs) without hardcoding them in the repository.

6. **Static Hosting (Firebase Hosting)**
   - Serves the compiled HTML, CSS, and JS assets over a CDN.

---

## Low-Level Design (LLD)

### 1. State Management (Zustand)

Global state is managed by Zustand (`src/stores/appStore.ts`). The store acts as a bridge between the React UI and the IndexedDB storage layer.

**Key Responsibilities:**
- **In-Memory Cache**: Keeps a synchronous copy of invoices, customers, and seller details to prevent UI flashing and enable instant filtering/searching.
- **DB Sync**: Interacts with the `db.ts` (Dexie) layer. When an action (e.g., `addInvoice`) is called, it updates IndexedDB asynchronously while updating the synchronous Zustand state immediately.
- **Business Logic**: Functions like `checkOverdueInvoices` evaluate invoice dates against the current system time to auto-update statuses cleanly on app boot.

### 2. Database Schema (Dexie.js)

The local IndexedDB structure (`src/lib/db.ts`) handles isolation via `userId`.

**Tables:**
- `invoices`: `id, userId, invoiceNumber, date, status`
- `customers`: `id, userId`
- `sellerDetails`: `id, userId` (Always a single row per user)

Migration handling is built in. When a user authenticates, the system checks for legacy `localStorage` data and safely migrates it into the structured IndexedDB schema.

### 3. Authentication Flow (`AuthContext.tsx`)

1. Application boots and initializes `AuthContext`.
2. Listens to Firebase `onAuthStateChanged`.
3. If no Firebase configuration is present, the app falls back to an "Offline Mode" by assigning a mock `userId` (`local-user`).
4. If a user logs in, the Auth provider extracts the `uid` and signals the `appStore` to load data specifically for that `uid`.

### 4. Backup & Restore Mechanism

The Google Drive integration (`src/lib/gdrive-backup.ts`) relies on Google Identity Services (GIS).

1. User clicks "Backup to Google Drive".
2. GIS triggers an OAuth popup requiring permissions for `drive.appdata`.
3. Application queries the Drive API to find the existing `backup.json` file.
4. Uses `FileReader` and multi-part boundary REST API calls to serialize the active user's IndexedDB data and push it to Google's servers.
5. Restore fetches the JSON, drops the local IndexedDB rows for that user, and hydrates the database.

### 5. PDF Generation (`src/lib/pdf.ts`)

Instead of utilizing a server headless browser (like Puppeteer), the PDF generation happens synchronously inside the client's browser memory.

- **`jsPDF`**: Handles the document sizing, pages, and base canvas.
- **`jspdf-autotable`**: Handles the rendering of the line-items table, calculating pagination dynamically if items overflow a single A4 page.
- Tax calculations (IGST vs CGST/SGST) are dynamically formatted based on the Place of Supply against the Seller's state.

### 6. Component Architecture

- **Pages (`src/pages/*`)**: Heavy, stateful components connected to the auth context and `appStore`. They handle routing and primary business actions.
- **UI Components (`src/components/ui/*`)**: Pure, presentational components built using shadcn/ui and Radix. They rely on `Tailwind CSS` for styling and are entirely state-agnostic.
- **Routing**: `react-router-dom` utilizing an `<AuthGuard>` wrapper component to gate access to protected pages.
