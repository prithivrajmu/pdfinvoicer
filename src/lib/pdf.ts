import { Invoice, SellerDetails, getItemTaxableValue, getItemGst, getInvoiceSubtotal, getInvoiceTotalGst, getInvoiceTotal, amountToWords } from "@/types/invoice";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const fmt = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const generateInvoicePDF = (invoice: Invoice, seller: SellerDetails) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const subtotal = getInvoiceSubtotal(invoice.items);
  const totalGst = getInvoiceTotalGst(invoice.items);
  const total = getInvoiceTotal(invoice.items);

  // Header - Business Name
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(seller.businessName || "Your Business", margin, 20);

  // Seller details
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  let sellerY = 26;
  if (seller.name) { doc.text(`Name: ${seller.name}`, margin, sellerY); sellerY += 4; }
  if (seller.phone) { doc.text(`Phone: ${seller.phone}`, margin, sellerY); sellerY += 4; }
  if (seller.address) { doc.text(seller.address, margin, sellerY); sellerY += 4; }
  if (seller.email) { doc.text(`Email: ${seller.email}`, margin, sellerY); sellerY += 4; }
  if (seller.cityState) { doc.text(`${seller.cityState}${seller.pincode ? " - " + seller.pincode : ""}`, margin, sellerY); sellerY += 4; }
  if (seller.gstin) { doc.text(`GSTIN: ${seller.gstin}`, margin, sellerY); sellerY += 4; }

  // TAX INVOICE title
  doc.setTextColor(0);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  const titleY = Math.max(sellerY + 4, 52);
  doc.text("TAX INVOICE", pageWidth / 2, titleY, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("ORIGINAL FOR RECIPIENT", pageWidth / 2, titleY + 4, { align: "center" });

  // Customer Detail + Invoice info
  const detailY = titleY + 12;
  doc.setDrawColor(200);
  doc.line(margin, detailY - 2, pageWidth - margin, detailY - 2);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Customer Detail", margin, detailY + 4);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60);

  // Right side - invoice info
  const rightX = 130;
  doc.text(`Invoice No.: ${invoice.invoiceNumber}`, rightX, detailY + 4);
  doc.text(`Invoice Date: ${new Date(invoice.issueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`, rightX, detailY + 9);

  // Left side - customer
  let custY = detailY + 9;
  doc.text(`M/S ${invoice.clientName}`, margin, custY); custY += 4;
  if (invoice.clientAddress) {
    const addrLines = doc.splitTextToSize(`Address: ${invoice.clientAddress}`, 110);
    doc.text(addrLines, margin, custY);
    custY += addrLines.length * 3.5;
  }
  if (invoice.clientPhone) { doc.text(`Phone: ${invoice.clientPhone}`, margin, custY); custY += 4; }
  if (invoice.clientGstin) { doc.text(`GSTIN: ${invoice.clientGstin}`, margin, custY); custY += 4; }
  if (invoice.placeOfSupply) { doc.text(`Place of Supply: ${invoice.placeOfSupply}`, margin, custY); custY += 4; }

  const tableStartY = Math.max(custY, detailY + 22) + 4;

  // Items table — with explicit column widths to prevent overflow
  const isIntra = invoice.gstType === "intra";

  const head = isIntra
    ? [["Sr.", "Product / Service", "HSN", "Qty", "Rate", "Taxable", "CGST%", "CGST", "SGST%", "SGST", "Total"]]
    : [["Sr.", "Product / Service", "HSN", "Qty", "Rate", "Taxable", "IGST%", "IGST", "Total"]];

  // Column widths that fit within contentWidth
  const colWidths = isIntra
    ? { 0: 8, 1: 38, 2: 16, 3: 14, 4: 18, 5: 20, 6: 12, 7: 16, 8: 12, 9: 16, 10: 20 }
    : { 0: 10, 1: 48, 2: 20, 3: 16, 4: 22, 5: 24, 6: 14, 7: 20, 8: 24 };

  const body = invoice.items.map((item, i) => {
    const taxable = getItemTaxableValue(item);
    const gst = getItemGst(item);
    const itemTotal = taxable + gst;
    const halfRate = item.gstRate / 2;
    const halfGst = gst / 2;
    const name = item.itemName + (item.description ? `\n${item.description}` : "");

    if (isIntra) {
      return [
        String(i + 1),
        name,
        item.hsnSac,
        `${item.quantity} ${item.unit}`,
        fmt(item.unitPrice),
        fmt(taxable),
        `${halfRate}%`,
        fmt(halfGst),
        `${halfRate}%`,
        fmt(halfGst),
        fmt(itemTotal),
      ];
    }
    return [
      String(i + 1),
      name,
      item.hsnSac,
      `${item.quantity} ${item.unit}`,
      fmt(item.unitPrice),
      fmt(taxable),
      `${item.gstRate}%`,
      fmt(gst),
      fmt(itemTotal),
    ];
  });

  autoTable(doc, {
    startY: tableStartY,
    head,
    body,
    styles: { fontSize: 6.5, cellPadding: 2, overflow: "linebreak" },
    headStyles: { fillColor: [37, 99, 185], textColor: 255, fontStyle: "bold", fontSize: 6, cellPadding: 2 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: colWidths as any,
    theme: "grid",
    tableWidth: contentWidth,
    margin: { left: margin, right: margin },
  });

  let finalY = (doc as any).lastAutoTable.finalY + 5;

  // Summary - right aligned
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0);

  const summaryLabelX = rightX;
  const summaryValueX = pageWidth - margin;

  doc.text("Taxable Amount:", summaryLabelX, finalY);
  doc.text(fmt(subtotal), summaryValueX, finalY, { align: "right" });
  finalY += 4;

  if (isIntra) {
    doc.text("Add: CGST", summaryLabelX, finalY);
    doc.text(fmt(totalGst / 2), summaryValueX, finalY, { align: "right" });
    finalY += 4;
    doc.text("Add: SGST", summaryLabelX, finalY);
    doc.text(fmt(totalGst / 2), summaryValueX, finalY, { align: "right" });
    finalY += 4;
  } else {
    doc.text("Add: IGST", summaryLabelX, finalY);
    doc.text(fmt(totalGst), summaryValueX, finalY, { align: "right" });
    finalY += 4;
  }

  doc.text("Total Tax:", summaryLabelX, finalY);
  doc.text(fmt(totalGst), summaryValueX, finalY, { align: "right" });
  finalY += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Total Amount:", summaryLabelX, finalY);
  doc.text(fmt(total), summaryValueX, finalY, { align: "right" });
  finalY += 6;

  // Total in words
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60);
  const wordsLines = doc.splitTextToSize(`Total in words: ${amountToWords(total)}`, contentWidth);
  doc.text(wordsLines, margin, finalY);
  finalY += wordsLines.length * 3.5 + 4;

  // Bank / Payment Details
  const hasBankDetails = seller.bankName || seller.accountNumber || seller.ifsc || seller.upiId;
  if (hasBankDetails) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(0);
    doc.text("Payment Details", margin, finalY);
    finalY += 4;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60);
    doc.setFontSize(7.5);
    if (seller.bankName) { doc.text(`Bank: ${seller.bankName}`, margin, finalY); finalY += 3.5; }
    if (seller.accountNumber) { doc.text(`A/C No: ${seller.accountNumber}`, margin, finalY); finalY += 3.5; }
    if (seller.ifsc) { doc.text(`IFSC: ${seller.ifsc}`, margin, finalY); finalY += 3.5; }
    if (seller.upiId) { doc.text(`UPI: ${seller.upiId}`, margin, finalY); finalY += 3.5; }
    finalY += 3;
  }

  // Terms
  if (invoice.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(0);
    doc.text("Terms and Conditions", margin, finalY);
    finalY += 4;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    doc.setFontSize(7);
    const noteLines = doc.splitTextToSize(invoice.notes, contentWidth);
    doc.text(noteLines, margin, finalY);
    finalY += noteLines.length * 3.5 + 6;
  }

  // Signature area
  doc.setTextColor(0);
  doc.setFontSize(8);
  doc.text(`For ${seller.businessName || ""}`, pageWidth - 60, finalY);
  finalY += 12;
  doc.text("Authorised Signatory", pageWidth - 60, finalY);

  doc.save(`${invoice.invoiceNumber}.pdf`);
};
