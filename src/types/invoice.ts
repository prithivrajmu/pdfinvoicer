export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export type GstType = "intra" | "inter"; // intra = CGST+SGST, inter = IGST

export interface StatusChange {
  from: InvoiceStatus;
  to: InvoiceStatus;
  timestamp: string;
  note?: string;
}

export interface SellerDetails {
  businessName: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  cityState: string;
  pincode: string;
  gstin: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  upiId: string;
  defaultNotes: string;
}

export interface LineItem {
  id: string;
  itemName: string;
  description: string;
  hsnSac: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  gstRate: number; // percentage e.g. 5, 12, 18, 28
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress: string;
  clientGstin: string;
  placeOfSupply: string;
  issueDate: string;
  dueDate: string;
  items: LineItem[];
  notes: string;
  status: InvoiceStatus;
  createdAt: string;
  gstType: GstType;
  statusHistory?: StatusChange[];
  paidDate?: string;
}

export const getItemTaxableValue = (item: LineItem) => item.quantity * item.unitPrice;

export const getItemGst = (item: LineItem) => {
  const taxable = getItemTaxableValue(item);
  return taxable * (item.gstRate / 100);
};

export const getInvoiceSubtotal = (items: LineItem[]) =>
  items.reduce((sum, item) => sum + getItemTaxableValue(item), 0);

export const getInvoiceTotalGst = (items: LineItem[]) =>
  items.reduce((sum, item) => sum + getItemGst(item), 0);

export const getInvoiceTotal = (items: LineItem[]): number =>
  getInvoiceSubtotal(items) + getInvoiceTotalGst(items);

export const formatINR = (amount: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);

// Number to words for Indian currency
const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function numberToWordsHelper(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " and " + numberToWordsHelper(n % 100) : "");
  if (n < 100000) return numberToWordsHelper(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + numberToWordsHelper(n % 1000) : "");
  if (n < 10000000) return numberToWordsHelper(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + numberToWordsHelper(n % 100000) : "");
  return numberToWordsHelper(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + numberToWordsHelper(n % 10000000) : "");
}

export function amountToWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let result = numberToWordsHelper(rupees) + " Rupees";
  if (paise > 0) result += " and " + numberToWordsHelper(paise) + " Paise";
  return result.toUpperCase() + " ONLY";
}
