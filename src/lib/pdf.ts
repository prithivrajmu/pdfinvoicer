import { Invoice, getInvoiceTotal } from "@/types/invoice";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateInvoicePDF = (invoice: Invoice) => {
  const doc = new jsPDF();
  const total = getInvoiceTotal(invoice.items);

  // Header
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", 20, 30);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(invoice.invoiceNumber, 20, 38);

  // Status badge
  doc.setFontSize(10);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 150, 30);

  // Dates
  doc.setTextColor(60);
  doc.text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 150, 38);
  doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 150, 45);

  // Bill To
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO", 20, 60);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(invoice.clientName, 20, 68);
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(invoice.clientEmail, 20, 75);
  const addressLines = doc.splitTextToSize(invoice.clientAddress, 80);
  doc.text(addressLines, 20, 82);

  // Table
  autoTable(doc, {
    startY: 100,
    head: [["Description", "Qty", "Unit Price", "Amount"]],
    body: invoice.items.map((item) => [
      item.description,
      item.quantity.toString(),
      `$${item.unitPrice.toFixed(2)}`,
      `$${(item.quantity * item.unitPrice).toFixed(2)}`,
    ]),
    styles: { fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: [37, 99, 185], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 25, halign: "center" },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: 35, halign: "right" },
    },
  });

  // Total
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(0);
  doc.text("Total:", 130, finalY);
  doc.text(`$${total.toFixed(2)}`, 170, finalY, { align: "right" });

  // Notes
  if (invoice.notes) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("Notes:", 20, finalY + 15);
    const noteLines = doc.splitTextToSize(invoice.notes, 170);
    doc.text(noteLines, 20, finalY + 22);
  }

  doc.save(`${invoice.invoiceNumber}.pdf`);
};
