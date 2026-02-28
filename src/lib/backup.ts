import { db } from "@/lib/db";

/**
 * Export all user data as a downloadable JSON file.
 * This is the offline/manual backup option.
 */
export async function exportToJSON(userId: string): Promise<void> {
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
        data: { invoices, customers, seller },
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pdfinvoicer-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Import data from a JSON backup file.
 * Returns counts of imported items.
 */
export async function importFromJSON(
    userId: string,
    file: File
): Promise<{ invoiceCount: number; customerCount: number }> {
    const text = await file.text();
    const backup = JSON.parse(text);

    if (!backup.data) {
        throw new Error("Invalid backup file format");
    }

    await db.transaction(
        "rw",
        db.invoices,
        db.customers,
        db.sellerDetails,
        async () => {
            // Clear existing data for this user
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
