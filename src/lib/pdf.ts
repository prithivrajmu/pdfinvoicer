import {
  Invoice,
  SellerDetails,
  amountToWords,
  getInvoiceSubtotal,
  getInvoiceTotal,
  getInvoiceTotalGst,
  getItemGst,
  getItemTaxableValue,
} from "@/types/invoice";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const fmt = (n: number) =>
  n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const BLUE: [number, number, number] = [84, 162, 255];
const BLUE_TEXT: [number, number, number] = [42, 120, 222];
const LIGHT_BLUE: [number, number, number] = [239, 247, 255];
const TEXT: [number, number, number] = [35, 35, 35];
const MUTED: [number, number, number] = [80, 80, 80];

const setText = (
  doc: jsPDF,
  size: number,
  style: "normal" | "bold" = "normal",
  color: [number, number, number] = TEXT
) => {
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
  doc.setTextColor(...color);
};

const drawBox = (
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  fillColor?: [number, number, number]
) => {
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.25);
  if (fillColor) {
    doc.setFillColor(...fillColor);
    doc.rect(x, y, w, h, "FD");
  } else {
    doc.rect(x, y, w, h);
  }
};

const drawLabelValueRows = (
  doc: jsPDF,
  x: number,
  y: number,
  labelWidth: number,
  maxWidth: number,
  rows: Array<{ label: string; value: string }>
) => {
  let currentY = y;
  rows.forEach(({ label, value }) => {
    const valueLines = doc.splitTextToSize(value || "-", maxWidth - labelWidth);
    setText(doc, 7, "bold");
    doc.text(label, x, currentY);
    setText(doc, 7, "normal", MUTED);
    doc.text(valueLines, x + labelWidth, currentY);
    currentY += Math.max(4.2, valueLines.length * 3.5 + 0.5);
  });
  return currentY;
};

export const generateInvoicePDF = (invoice: Invoice, seller: SellerDetails) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const isIntra = invoice.gstType === "intra";
  const subtotal = getInvoiceSubtotal(invoice.items);
  const totalGst = getInvoiceTotalGst(invoice.items);
  const total = getInvoiceTotal(invoice.items);

  const sellerLines = [
    seller.address,
    seller.cityState ? `${seller.cityState}${seller.pincode ? ` - ${seller.pincode}` : ""}` : "",
  ].filter(Boolean);

  const sellerRight = [
    seller.name ? `Name : ${seller.name}` : "",
    seller.phone ? `Phone : ${seller.phone}` : "",
    seller.email ? `Email : ${seller.email}` : "",
  ].filter(Boolean);

  const termsText = invoice.notes || seller.defaultNotes || "No additional terms provided.";
  const termsLines = doc.splitTextToSize(termsText, 102);
  const wordsLines = doc.splitTextToSize(amountToWords(total), 102);

  // Header
  setText(doc, 14, "bold");
  doc.text(seller.businessName || "Your Business", margin, 14);

  setText(doc, 7, "normal", MUTED);
  let sellerAddressY = 19;
  sellerLines.forEach((line) => {
    doc.text(line, margin, sellerAddressY);
    sellerAddressY += 3.7;
  });

  setText(doc, 7, "bold");
  let rightY = 14;
  sellerRight.forEach((line) => {
    doc.text(line, pageWidth - margin, rightY, { align: "right" });
    rightY += 3.8;
  });

  // Top strip
  const stripY = 30;
  const stripH = 8;
  drawBox(doc, margin, stripY, contentWidth, stripH);
  drawBox(doc, margin, stripY, 62, stripH, LIGHT_BLUE);
  drawBox(doc, margin + 62, stripY, 74, stripH, LIGHT_BLUE);
  drawBox(doc, margin + 136, stripY, contentWidth - 136, stripH, LIGHT_BLUE);

  setText(doc, 8, "bold");
  doc.text(`GSTIN : ${seller.gstin || "-"}`, margin + 2, stripY + 5.4);
  setText(doc, 11, "bold", BLUE_TEXT);
  doc.text("TAX INVOICE", pageWidth / 2, stripY + 5.8, { align: "center" });
  setText(doc, 7, "bold");
  doc.text("ORIGINAL FOR RECIPIENT", pageWidth - margin - 2, stripY + 5.2, { align: "right" });

  // Customer and invoice info panels
  const detailY = stripY + stripH;
  const detailH = 34;
  const leftW = 72;
  const rightW = contentWidth - leftW;

  drawBox(doc, margin, detailY, leftW, detailH);
  drawBox(doc, margin, detailY, leftW, 6.2, LIGHT_BLUE);
  setText(doc, 7.5, "bold");
  doc.text("Customer Detail", margin + 2, detailY + 4.3);

  drawBox(doc, margin + leftW, detailY, rightW, detailH);
  setText(doc, 7, "bold");
  doc.text("Invoice No.", margin + leftW + 14, detailY + 10);
  doc.text(invoice.invoiceNumber || "-", margin + leftW + 42, detailY + 10, { align: "center" });
  doc.text("Invoice Date", pageWidth - margin - 36, detailY + 10, { align: "center" });
  setText(doc, 7, "normal", MUTED);
  doc.text(formatDate(invoice.issueDate), pageWidth - margin - 2, detailY + 10, { align: "right" });

  drawLabelValueRows(
    doc,
    margin + 2,
    detailY + 10,
    15,
    leftW - 4,
    [
      { label: "M/S", value: invoice.clientName || "-" },
      { label: "Address", value: invoice.clientAddress || "-" },
      { label: "Phone", value: invoice.clientPhone || "-" },
      { label: "GSTIN", value: invoice.clientGstin || "-" },
      { label: "Place of\nSupply", value: invoice.placeOfSupply || "-" },
    ]
  );

  // Item table
  const tableStartY = detailY + detailH;
  const totalQuantity = invoice.items.reduce((sum, item) => sum + item.quantity, 0);
  const commonUnit =
    invoice.items.length > 0 && invoice.items.every((item) => item.unit === invoice.items[0].unit)
      ? invoice.items[0].unit
      : "";

  const head = isIntra
    ? [
        [
          { content: "Sr.\nNo.", rowSpan: 2 },
          { content: "Name of Product / Service", rowSpan: 2 },
          { content: "HSN / SAC", rowSpan: 2 },
          { content: "Qty", rowSpan: 2 },
          { content: "Rate", rowSpan: 2 },
          { content: "Taxable Value", rowSpan: 2 },
          { content: "CGST", colSpan: 2 },
          { content: "SGST", colSpan: 2 },
          { content: "Total", rowSpan: 2 },
        ],
        ["", "", "", "", "", "", "%", "Amount", "%", "Amount", ""],
      ]
    : [
        [
          { content: "Sr.\nNo.", rowSpan: 2 },
          { content: "Name of Product / Service", rowSpan: 2 },
          { content: "HSN / SAC", rowSpan: 2 },
          { content: "Qty", rowSpan: 2 },
          { content: "Rate", rowSpan: 2 },
          { content: "Taxable Value", rowSpan: 2 },
          { content: "IGST", colSpan: 2 },
          { content: "Total", rowSpan: 2 },
        ],
        ["", "", "", "", "", "", "%", "Amount", ""],
      ];

  const body = invoice.items.map((item, index) => {
    const taxable = getItemTaxableValue(item);
    const gst = getItemGst(item);
    const totalItem = taxable + gst;
    const label = item.description ? `${item.itemName}\n${item.description}` : item.itemName;

    if (isIntra) {
      return [
        String(index + 1),
        label,
        item.hsnSac,
        `${item.quantity.toFixed(2)} ${item.unit}`,
        fmt(item.unitPrice),
        fmt(taxable),
        `${(item.gstRate / 2).toFixed(2)}`,
        fmt(gst / 2),
        `${(item.gstRate / 2).toFixed(2)}`,
        fmt(gst / 2),
        fmt(totalItem),
      ];
    }

    return [
      String(index + 1),
      label,
      item.hsnSac,
      `${item.quantity.toFixed(2)} ${item.unit}`,
      fmt(item.unitPrice),
      fmt(taxable),
      `${item.gstRate.toFixed(2)}`,
      fmt(gst),
      fmt(totalItem),
    ];
  });

  const foot = isIntra
    ? [[
        { content: "Total", colSpan: 3, styles: { halign: "right", fontStyle: "bold" } },
        `${totalQuantity.toFixed(2)}${commonUnit ? ` ${commonUnit}` : ""}`,
        "",
        fmt(subtotal),
        "",
        fmt(totalGst / 2),
        "",
        fmt(totalGst / 2),
        fmt(total),
      ]]
    : [[
        { content: "Total", colSpan: 3, styles: { halign: "right", fontStyle: "bold" } },
        `${totalQuantity.toFixed(2)}${commonUnit ? ` ${commonUnit}` : ""}`,
        "",
        fmt(subtotal),
        "",
        fmt(totalGst),
        fmt(total),
      ]];

  const columnStyles = isIntra
    ? {
        0: { cellWidth: 6.5, halign: "center" },
        1: { cellWidth: 43.5 },
        2: { cellWidth: 16, halign: "center" },
        3: { cellWidth: 16, halign: "center" },
        4: { cellWidth: 16, halign: "right" },
        5: { cellWidth: 18, halign: "right" },
        6: { cellWidth: 8.5, halign: "center" },
        7: { cellWidth: 14, halign: "right" },
        8: { cellWidth: 8.5, halign: "center" },
        9: { cellWidth: 14, halign: "right" },
        10: { cellWidth: 18, halign: "right" },
      }
    : {
        0: { cellWidth: 7, halign: "center" },
        1: { cellWidth: 52 },
        2: { cellWidth: 18, halign: "center" },
        3: { cellWidth: 16, halign: "center" },
        4: { cellWidth: 18, halign: "right" },
        5: { cellWidth: 22, halign: "right" },
        6: { cellWidth: 10, halign: "center" },
        7: { cellWidth: 18, halign: "right" },
        8: { cellWidth: 22, halign: "right" },
      };

  autoTable(doc, {
    startY: tableStartY,
    head,
    body,
    foot,
    theme: "grid",
    tableWidth: contentWidth,
    margin: { left: margin, right: margin },
    showFoot: "lastPage",
    styles: {
      font: "helvetica",
      fontSize: 6,
      cellPadding: 1.2,
      lineColor: BLUE,
      lineWidth: 0.2,
      textColor: TEXT,
      valign: "top",
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: LIGHT_BLUE,
      textColor: TEXT,
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
    },
    footStyles: {
      fillColor: LIGHT_BLUE,
      textColor: TEXT,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [252, 253, 255],
    },
    columnStyles: columnStyles as never,
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 1 && data.cell.raw) {
        data.cell.styles.fontStyle = "bold";
      }
      if (data.section === "body" && data.row.index === 0 && data.column.index === 1) {
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  let bottomY = (doc as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  const leftBottomX = margin;
  const leftBottomW = 112;
  const rightBottomX = margin + leftBottomW;
  const rightBottomW = contentWidth - leftBottomW;

  const wordsBoxH = Math.max(12, 8 + wordsLines.length * 3.8);
  const termsBoxH = Math.max(26, 10 + termsLines.length * 3.7);
  const summaryBoxH = 22;
  const certBoxH = 12;
  const signBoxH = Math.max(22, wordsBoxH + termsBoxH - summaryBoxH - certBoxH);
  const fullBottomH = wordsBoxH + termsBoxH;

  if (bottomY + fullBottomH + 18 > pageHeight) {
    doc.addPage();
    bottomY = margin;
  } else {
    bottomY += 3;
  }

  // Left bottom: words + terms
  drawBox(doc, leftBottomX, bottomY, leftBottomW, wordsBoxH);
  drawBox(doc, leftBottomX, bottomY, leftBottomW, 6, LIGHT_BLUE);
  setText(doc, 7, "bold");
  doc.text("Total in words", leftBottomX + leftBottomW / 2, bottomY + 4.1, { align: "center" });
  setText(doc, 6.5, "normal", TEXT);
  doc.text(wordsLines, leftBottomX + 2, bottomY + 9.5);

  const termsY = bottomY + wordsBoxH;
  drawBox(doc, leftBottomX, termsY, leftBottomW, termsBoxH);
  drawBox(doc, leftBottomX, termsY, leftBottomW, 6, LIGHT_BLUE);
  setText(doc, 7, "bold");
  doc.text("Terms and Conditions", leftBottomX + leftBottomW / 2, termsY + 4.1, { align: "center" });
  setText(doc, 6.3, "normal", MUTED);
  doc.text(termsLines, leftBottomX + 2, termsY + 9);

  // Right bottom: summary
  drawBox(doc, rightBottomX, bottomY, rightBottomW, summaryBoxH);
  const summaryRows = isIntra
    ? [
        ["Taxable Amount", fmt(subtotal)],
        ["Add : CGST", fmt(totalGst / 2)],
        ["Add : SGST", fmt(totalGst / 2)],
        ["Total Tax", fmt(totalGst)],
        ["Total Amount After Tax", `₹${fmt(total)}`],
      ]
    : [
        ["Taxable Amount", fmt(subtotal)],
        ["Add : IGST", fmt(totalGst)],
        ["Total Tax", fmt(totalGst)],
        ["Total Amount After Tax", `₹${fmt(total)}`],
      ];

  let summaryY = bottomY + 4.2;
  summaryRows.forEach(([label, value], index) => {
    const isTotalRow = index === summaryRows.length - 1;
    setText(doc, isTotalRow ? 7.2 : 6.5, isTotalRow ? "bold" : "normal");
    doc.text(label, rightBottomX + 2, summaryY);
    doc.text(value, rightBottomX + rightBottomW - 2, summaryY, { align: "right" });
    summaryY += 4.1;
  });

  const certY = bottomY + summaryBoxH;
  drawBox(doc, rightBottomX, certY, rightBottomW, certBoxH);
  setText(doc, 5.4, "normal", MUTED);
  doc.text(
    "Certified that the particulars given above are true and correct.",
    rightBottomX + rightBottomW / 2,
    certY + 6.8,
    { align: "center" }
  );

  const signY = certY + certBoxH;
  drawBox(doc, rightBottomX, signY, rightBottomW, signBoxH);
  setText(doc, 7, "bold");
  doc.text(`For ${seller.businessName || "Your Business"}`, rightBottomX + rightBottomW / 2, signY + 9, {
    align: "center",
  });
  setText(doc, 6.2, "normal");
  doc.text("Authorised Signatory", rightBottomX + rightBottomW / 2, signY + signBoxH - 3, {
    align: "center",
  });

  doc.save(`${invoice.invoiceNumber}.pdf`);
};
