import { useState, useEffect, useCallback } from "react";
import { Invoice, InvoiceStatus } from "@/types/invoice";

const STORAGE_KEY = "invoices";

const loadInvoices = (): Invoice[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveInvoices = (invoices: Invoice[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
};

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>(loadInvoices);

  useEffect(() => {
    saveInvoices(invoices);
  }, [invoices]);

  const addInvoice = useCallback((invoice: Invoice) => {
    setInvoices((prev) => [invoice, ...prev]);
  }, []);

  const updateStatus = useCallback((id: string, status: InvoiceStatus) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status } : inv))
    );
  }, []);

  const deleteInvoice = useCallback((id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  }, []);

  const getInvoice = useCallback(
    (id: string) => invoices.find((inv) => inv.id === id),
    [invoices]
  );

  const nextInvoiceNumber = useCallback(() => {
    const max = invoices.reduce((m, inv) => {
      const num = parseInt(inv.invoiceNumber.replace("INV-", ""), 10);
      return isNaN(num) ? m : Math.max(m, num);
    }, 0);
    return `INV-${String(max + 1).padStart(4, "0")}`;
  }, [invoices]);

  return { invoices, addInvoice, updateStatus, deleteInvoice, getInvoice, nextInvoiceNumber };
};
