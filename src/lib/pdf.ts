import { Invoice, SellerDetails, getItemTaxableValue, getItemGst, getInvoiceSubtotal, getInvoiceTotalGst, getInvoiceTotal, amountToWords } from "@/types/invoice";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const fmt = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const generateInvoicePDF = (invoice: Invoice, seller: SellerDetails) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const subtotal = getInvoiceSubtotal(invoice.items);
  const totalGst = getInvoiceTotalGst(invoice.items);
  const total = getInvoiceTotal(invoice.items);

  // Header - Business Name
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(seller.businessName || "Your Business", 14, 20);

  // Seller details
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  let sellerY = 26;
  if (seller.name) { doc.text(`Name: ${seller.name}`, 14, sellerY); sellerY += 5; }
  if (seller.phone) { doc.text(`Phone: ${seller.phone}`, 14, sellerY); sellerY += 5; }
  if (seller.address) { doc.text(seller.address, 14, sellerY); sellerY += 5; }
  if (seller.email) { doc.text(`Email: ${seller.email}`, 14, sellerY); sellerY += 5; }
  if (seller.cityState) { doc.text(`${seller.cityState}${seller.pincode ? " - " + seller.pincode : ""}`, 14, sellerY); sellerY += 5; }
  if (seller.gstin) { doc.text(`GSTIN: ${seller.gstin}`, 14, sellerY); sellerY += 5; }

  // TAX INVOICE title
  doc.setTextColor(0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  const titleY = Math.max(sellerY + 5, 55);
  doc.text("TAX INVOICE", pageWidth / 2, titleY, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("ORIGINAL FOR RECIPIENT", pageWidth / 2, titleY + 5, { align: "center" });

  // Customer Detail + Invoice info
  const detailY = titleY + 14;
  doc.setDrawColor(200);
  doc.line(14, detailY - 2, pageWidth - 14, detailY - 2);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Customer Detail", 14, detailY + 4);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60);

  // Right side - invoice info
  doc.text(`Invoice No.: ${invoice.invoiceNumber}`, 130, detailY + 4);
  doc.text(`Invoice Date: ${new Date(invoice.issueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`, 130, detailY + 10);

  // Left side - customer
  let custY = detailY + 10;
  doc.text(`M/S ${invoice.clientName}`, 14, custY); custY += 5;
  if (invoice.clientAddress) { doc.text(`Address: ${invoice.clientAddress}`, 14, custY); custY += 5; }
  if (invoice.clientPhone) { doc.text(`Phone: ${invoice.clientPhone}`, 14, custY); custY += 5; }
  if (invoice.clientGstin) { doc.text(`GSTIN: ${invoice.clientGstin}`, 14, custY); custY += 5; }
  if (invoice.placeOfSupply) { doc.text(`Place of Supply: ${invoice.placeOfSupply}`, 14, custY); custY += 5; }

  const tableStartY = Math.max(custY, detailY + 26) + 4;

  // Items table with proper CGST/SGST half-rate breakdown
  const isIntra = invoice.gstType === "intra";
  const head = isIntra
    ? [["Sr.", "Name of Product / Service", "HSN/SAC", "Qty", "Rate", "Taxable Value", "CGST %", "CGST Amt", "SGST %", "SGST Amt", "Total"]]
    : [["Sr.", "Name of Product / Service", "HSN/SAC", "Qty", "Rate", "Taxable Value", "IGST %", "IGST Amt", "Total"]];

  const body = invoice.items.map((item, i) => {
    const taxable = getItemTaxableValue(item);
    const gst = getItemGst(item);
    const itemTotal = taxable + gst;
    const halfRate = item.gstRate / 2;
    const halfGst = gst / 2;
    const displayName = item.itemName + (item.description ? `\n${item.description}` : "");

    if (isIntra) {
      return [
        String(i + 1),
        displayName,
        item.hsnSac,
        `${fmt(item.quantity)} ${item.unit}`,
        fmt(item.unitPrice),
        fmt(taxable),
        `${fmt(halfRate)}%`,
        fmt(halfGst),
        `${fmt(halfRate)}%`,
        fmt(halfGst),
        fmt(itemTotal),
      ];
    }
    return [
      String(i + 1),
      displayName,
      item.hsnSac,
      `${fmt(item.quantity)} ${item.unit}`,
      fmt(item.unitPrice),
      fmt(taxable),
      `${fmt(item.gstRate)}%`,
      fmt(gst),
      fmt(itemTotal),
    ];
  });

  autoTable(doc, {
    startY: tableStartY,
    head,
    body,
    styles: { fontSize: 7.5, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 185], textColor: 255, fontStyle: "bold", fontSize: 7 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    theme: "grid",
  });

  let finalY = (doc as any).lastAutoTable.finalY + 6;

  // Summary
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0);

  const summaryX = 130;
  doc.text("Taxable Amount:", summaryX, finalY);
  doc.text(fmt(subtotal), pageWidth - 14, finalY, { align: "right" });
  finalY += 5;

  if (isIntra) {
    doc.text("Add: CGST", summaryX, finalY);
    doc.text(fmt(totalGst / 2), pageWidth - 14, finalY, { align: "right" });
    finalY += 5;
    doc.text("Add: SGST", summaryX, finalY);
    doc.text(fmt(totalGst / 2), pageWidth - 14, finalY, { align: "right" });
    finalY += 5;
  } else {
    doc.text("Add: IGST", summaryX, finalY);
    doc.text(fmt(totalGst), pageWidth - 14, finalY, { align: "right" });
    finalY += 5;
  }

  doc.text("Total Tax:", summaryX, finalY);
  doc.text(fmt(totalGst), pageWidth - 14, finalY, { align: "right" });
  finalY += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Total Amount After Tax:", summaryX - 20, finalY);
  doc.text(fmt(total), pageWidth - 14, finalY, { align: "right" });
  finalY += 8;

  // Total in words
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60);
  const wordsLines = doc.splitTextToSize(`Total in words: ${amountToWords(total)}`, pageWidth - 28);
  doc.text(wordsLines, 14, finalY);
  finalY += wordsLines.length * 4 + 6;

  // Terms
  if (invoice.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.text("Terms and Conditions", 14, finalY);
    finalY += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    doc.setFontSize(8);
    const noteLines = doc.splitTextToSize(invoice.notes, pageWidth - 28);
    doc.text(noteLines, 14, finalY);
    finalY += noteLines.length * 4 + 8;
  }

  // Signature area
  doc.setTextColor(0);
  doc.setFontSize(8);
  doc.text(`For ${seller.businessName || ""}`, pageWidth - 60, finalY);
  finalY += 15;
  doc.text("Authorised Signatory", pageWidth - 60, finalY);

  doc.save(`${invoice.invoiceNumber}.pdf`);
};
