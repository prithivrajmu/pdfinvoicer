import { db } from "@/lib/db";
import { auth } from "@/lib/firebase";

/**
 * Google Drive Backup via Google Identity Services (GIS) + Drive REST API.
 * Uses the same Google project as Firebase Auth.
 *
 * The backup file is stored as `pdfinvoicer-backup.json` in the user's
 * Google Drive appDataFolder (hidden from the user's Drive UI, app-specific).
 */

const BACKUP_FILENAME = "pdfinvoicer-backup.json";
const SCOPES = "https://www.googleapis.com/auth/drive.appdata";

/* ── Token Management ── */

let accessToken: string | null = null;

/**
 * Get a Google access token via the GIS popup.
 * Re-uses the token if still fresh.
 */
function getAccessToken(): Promise<string> {
    if (accessToken) return Promise.resolve(accessToken);

    return new Promise((resolve, reject) => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) {
            reject(
                new Error(
                    "VITE_GOOGLE_CLIENT_ID is not set. Add it to your .env file."
                )
            );
            return;
        }

        // @ts-expect-error google.accounts loaded via script tag
        const tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: SCOPES,
            callback: (response: { access_token?: string; error?: string }) => {
                if (response.error) {
                    reject(new Error(response.error));
                    return;
                }
                accessToken = response.access_token!;
                // Auto-clear after 50 min (tokens last 60 min)
                setTimeout(() => {
                    accessToken = null;
                }, 50 * 60 * 1000);
                resolve(accessToken);
            },
        });

        tokenClient.requestAccessToken();
    });
}

/* ── Drive API Helpers ── */

async function findBackupFileId(token: string): Promise<string | null> {
    const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${BACKUP_FILENAME}'&fields=files(id,name,modifiedTime)`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    return data.files?.[0]?.id ?? null;
}

/* ── Public API ── */

export async function backupToGoogleDrive(userId: string): Promise<void> {
    const token = await getAccessToken();

    // Gather all data
    const invoices = await db.invoices.where("userId").equals(userId).toArray();
    const customers = await db.customers
        .where("userId")
        .equals(userId)
        .toArray();
    const seller = await db.sellerDetails
        .where("userId")
        .equals(userId)
        .first();

    const backup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        userId,
        data: { invoices, customers, seller },
    };

    const content = JSON.stringify(backup, null, 2);

    // Check if backup file already exists
    const existingId = await findBackupFileId(token);

    if (existingId) {
        // Update existing file
        await fetch(
            `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=media`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: content,
            }
        );
    } else {
        // Create new file in appDataFolder
        const metadata = {
            name: BACKUP_FILENAME,
            parents: ["appDataFolder"],
        };

        const form = new FormData();
        form.append(
            "metadata",
            new Blob([JSON.stringify(metadata)], { type: "application/json" })
        );
        form.append(
            "file",
            new Blob([content], { type: "application/json" })
        );

        await fetch(
            "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
            {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: form,
            }
        );
    }
}

export async function restoreFromGoogleDrive(
    userId: string
): Promise<{ invoiceCount: number; customerCount: number } | null> {
    const token = await getAccessToken();

    const fileId = await findBackupFileId(token);
    if (!fileId) return null;

    const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    const backup = await res.json();

    if (!backup.data) return null;

    // Clear existing and import
    await db.transaction(
        "rw",
        db.invoices,
        db.customers,
        db.sellerDetails,
        async () => {
            await db.invoices.where("userId").equals(userId).delete();
            await db.customers.where("userId").equals(userId).delete();
            await db.sellerDetails.where("userId").equals(userId).delete();

            if (backup.data.invoices?.length) {
                await db.invoices.bulkPut(
                    backup.data.invoices.map((i: any) => ({ ...i, userId }))
                );
            }
            if (backup.data.customers?.length) {
                await db.customers.bulkPut(
                    backup.data.customers.map((c: any) => ({ ...c, userId }))
                );
            }
            if (backup.data.seller) {
                await db.sellerDetails.put({ ...backup.data.seller, userId });
            }
        }
    );

    return {
        invoiceCount: backup.data.invoices?.length ?? 0,
        customerCount: backup.data.customers?.length ?? 0,
    };
}

export async function getBackupInfo(
    token?: string
): Promise<{ modifiedTime: string } | null> {
    const t = token ?? (await getAccessToken());
    const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${BACKUP_FILENAME}'&fields=files(id,name,modifiedTime)`,
        { headers: { Authorization: `Bearer ${t}` } }
    );
    const data = await res.json();
    return data.files?.[0] ?? null;
}

/** Check if Google Identity Services script is loaded */
export function isGISAvailable(): boolean {
    // @ts-expect-error google.accounts may not be loaded
    return typeof google !== "undefined" && !!google?.accounts?.oauth2;
}
