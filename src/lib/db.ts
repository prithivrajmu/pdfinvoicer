import Dexie, { type Table } from "dexie";
import type { Invoice } from "@/types/invoice";
import type { Customer } from "@/types/customer";
import type { SellerDetails } from "@/types/invoice";

/* ── DB-specific interfaces with userId scoping ── */

export interface DBInvoice extends Invoice {
    userId: string;
}

export interface DBCustomer extends Customer {
    userId: string;
}

export interface DBSellerDetails extends SellerDetails {
    id?: string;
    userId: string;
}

/* ── Dexie Database ── */

class InvoicerDB extends Dexie {
    invoices!: Table<DBInvoice>;
    customers!: Table<DBCustomer>;
    sellerDetails!: Table<DBSellerDetails>;

    constructor() {
        super("pdfinvoicer");

        this.version(1).stores({
            invoices:
                "id, userId, invoiceNumber, clientName, status, createdAt, issueDate, dueDate, [userId+status], [userId+createdAt]",
            customers: "id, userId, name, [userId+name]",
            sellerDetails: "++id, userId",
        });
    }
}

export const db = new InvoicerDB();

/* ── One-time migration from localStorage ── */

export async function migrateFromLocalStorage(userId: string) {
    const invoicesRaw = localStorage.getItem("invoices");
    const customersRaw = localStorage.getItem("customers");
    const sellerRaw = localStorage.getItem("seller_details");

    let migrated = false;

    if (invoicesRaw) {
        try {
            const invoices: Invoice[] = JSON.parse(invoicesRaw);
            if (invoices.length > 0) {
                await db.invoices.bulkPut(
                    invoices.map((inv) => ({ ...inv, userId }))
                );
                migrated = true;
            }
        } catch {
            console.warn("Failed to migrate invoices from localStorage");
        }
        localStorage.removeItem("invoices");
    }

    if (customersRaw) {
        try {
            const customers: Customer[] = JSON.parse(customersRaw);
            if (customers.length > 0) {
                await db.customers.bulkPut(
                    customers.map((c) => ({ ...c, userId }))
                );
                migrated = true;
            }
        } catch {
            console.warn("Failed to migrate customers from localStorage");
        }
        localStorage.removeItem("customers");
    }

    if (sellerRaw) {
        try {
            const seller: SellerDetails = JSON.parse(sellerRaw);
            if (seller.businessName || seller.name) {
                await db.sellerDetails.put({ ...seller, userId });
                migrated = true;
            }
        } catch {
            console.warn("Failed to migrate seller details from localStorage");
        }
        localStorage.removeItem("seller_details");
    }

    return migrated;
}
