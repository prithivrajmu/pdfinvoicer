export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  issueDate: string;
  dueDate: string;
  items: LineItem[];
  notes: string;
  status: InvoiceStatus;
  createdAt: string;
}

export const getInvoiceTotal = (items: LineItem[]): number =>
  items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
