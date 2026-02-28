import { create } from "zustand";
import { db } from "@/lib/db";
import type { Invoice, InvoiceStatus, SellerDetails, StatusChange } from "@/types/invoice";
import type { Customer } from "@/types/customer";

interface AppState {
    /* ── Data ── */
    invoices: Invoice[];
    customers: Customer[];
    seller: SellerDetails;
    dataLoaded: boolean;

    /* ── Actions: Data Loading ── */
    loadData: (userId: string) => Promise<void>;
    clearStoreData: () => void;

    /* ── Actions: Invoices ── */
    addInvoice: (userId: string, invoice: Invoice) => Promise<void>;
    updateInvoiceStatus: (userId: string, id: string, status: InvoiceStatus, note?: string) => Promise<void>;
    deleteInvoice: (userId: string, id: string) => Promise<void>;
    getInvoice: (id: string) => Invoice | undefined;
    nextInvoiceNumber: () => string;
    checkOverdueInvoices: (userId: string) => Promise<number>;

    /* ── Actions: Customers ── */
    addCustomer: (userId: string, c: Omit<Customer, "id">) => Promise<Customer>;
    updateCustomer: (userId: string, id: string, updates: Partial<Customer>) => Promise<void>;
    deleteCustomer: (userId: string, id: string) => Promise<void>;

    /* ── Actions: Seller ── */
    updateSeller: (userId: string, updates: Partial<SellerDetails>) => Promise<void>;
}

const defaultSeller: SellerDetails = {
    businessName: "",
    name: "",
    phone: "",
    email: "",
    address: "",
    cityState: "",
    pincode: "",
    gstin: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    upiId: "",
    defaultNotes: "",
};

export const useAppStore = create<AppState>((set, get) => ({
    invoices: [],
    customers: [],
    seller: defaultSeller,
    dataLoaded: false,

    /* ── Load all data from IndexedDB ── */
    loadData: async (userId: string) => {
        const [invoices, customers, sellerRow] = await Promise.all([
            db.invoices.where("userId").equals(userId).reverse().sortBy("createdAt"),
            db.customers.where("userId").equals(userId).toArray(),
            db.sellerDetails.where("userId").equals(userId).first(),
        ]);

        // Strip userId from DB objects for the store
        const cleanInvoices = invoices.map(({ userId: _, ...rest }) => rest as Invoice);
        const cleanCustomers = customers.map(({ userId: _, ...rest }) => rest as Customer);
        const seller = sellerRow
            ? { ...defaultSeller, ...(() => { const { userId: _, id: __, ...rest } = sellerRow; return rest; })() }
            : defaultSeller;

        set({ invoices: cleanInvoices, customers: cleanCustomers, seller, dataLoaded: true });
    },

    clearStoreData: () => {
        set({ invoices: [], customers: [], seller: defaultSeller, dataLoaded: false });
    },

    /* ── Invoices ── */
    addInvoice: async (userId, invoice) => {
        await db.invoices.put({ ...invoice, userId });
        set((s) => ({ invoices: [invoice, ...s.invoices] }));
    },

    updateInvoiceStatus: async (userId, id, status, note) => {
        const invoice = get().invoices.find((inv) => inv.id === id);
        if (!invoice) return;

        const change: StatusChange = {
            from: invoice.status,
            to: status,
            timestamp: new Date().toISOString(),
            note,
        };

        const updates: Partial<Invoice> = {
            status,
            statusHistory: [...(invoice.statusHistory || []), change],
        };

        if (status === "paid") {
            updates.paidDate = new Date().toISOString();
        }

        await db.invoices.update(id, { ...updates, userId });
        set((s) => ({
            invoices: s.invoices.map((inv) =>
                inv.id === id ? { ...inv, ...updates } : inv
            ),
        }));
    },

    deleteInvoice: async (userId, id) => {
        await db.invoices.delete(id);
        set((s) => ({ invoices: s.invoices.filter((inv) => inv.id !== id) }));
    },

    getInvoice: (id) => get().invoices.find((inv) => inv.id === id),

    nextInvoiceNumber: () => {
        const max = get().invoices.reduce((m, inv) => {
            const num = parseInt(inv.invoiceNumber.replace("INV-", ""), 10);
            return isNaN(num) ? m : Math.max(m, num);
        }, 0);
        return `INV-${String(max + 1).padStart(4, "0")}`;
    },

    checkOverdueInvoices: async (userId) => {
        const today = new Date().toISOString().split("T")[0];
        const { invoices } = get();
        let count = 0;

        for (const inv of invoices) {
            if (inv.status === "sent" && inv.dueDate < today) {
                const change: StatusChange = {
                    from: "sent",
                    to: "overdue",
                    timestamp: new Date().toISOString(),
                    note: "Auto-detected: past due date",
                };
                await db.invoices.update(inv.id, {
                    status: "overdue",
                    statusHistory: [...(inv.statusHistory || []), change],
                    userId,
                });
                count++;
            }
        }

        if (count > 0) {
            set((s) => ({
                invoices: s.invoices.map((inv) =>
                    inv.status === "sent" && inv.dueDate < today
                        ? {
                            ...inv,
                            status: "overdue" as InvoiceStatus,
                            statusHistory: [
                                ...(inv.statusHistory || []),
                                {
                                    from: "sent" as InvoiceStatus,
                                    to: "overdue" as InvoiceStatus,
                                    timestamp: new Date().toISOString(),
                                    note: "Auto-detected: past due date",
                                },
                            ],
                        }
                        : inv
                ),
            }));
        }

        return count;
    },

    /* ── Customers ── */
    addCustomer: async (userId, c) => {
        const customer: Customer = { ...c, id: crypto.randomUUID() };
        await db.customers.put({ ...customer, userId });
        set((s) => ({ customers: [customer, ...s.customers] }));
        return customer;
    },

    updateCustomer: async (userId, id, updates) => {
        await db.customers.update(id, { ...updates, userId });
        set((s) => ({
            customers: s.customers.map((c) =>
                c.id === id ? { ...c, ...updates } : c
            ),
        }));
    },

    deleteCustomer: async (userId, id) => {
        await db.customers.delete(id);
        set((s) => ({ customers: s.customers.filter((c) => c.id !== id) }));
    },

    /* ── Seller ── */
    updateSeller: async (userId, updates) => {
        const current = get().seller;
        const merged = { ...current, ...updates };
        // Upsert: find existing or create
        const existing = await db.sellerDetails.where("userId").equals(userId).first();
        if (existing?.id) {
            await db.sellerDetails.update(existing.id, { ...merged, userId });
        } else {
            await db.sellerDetails.put({ ...merged, userId });
        }
        set({ seller: merged });
    },
}));
