import { useParams, useNavigate } from "react-router-dom";
import { Invoice, InvoiceStatus, getInvoiceTotal, getInvoiceSubtotal, getInvoiceTotalGst, getItemTaxableValue, getItemGst, formatINR } from "@/types/invoice";
import { SellerDetails } from "@/types/invoice";
import { InvoiceStatusBadge } from "@/components/InvoiceStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateInvoicePDF } from "@/lib/pdf";
import { ArrowLeft, Download, Trash2 } from "lucide-react";

interface InvoiceDetailProps {
  getInvoice: (id: string) => Invoice | undefined;
  updateStatus: (id: string, status: InvoiceStatus) => void;
  deleteInvoice: (id: string) => void;
  seller: SellerDetails;
}

export const InvoiceDetail = ({ getInvoice, updateStatus, deleteInvoice, seller }: InvoiceDetailProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const invoice = getInvoice(id!);

  if (!invoice) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <p className="text-muted-foreground">Invoice not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>Go Back</Button>
      </div>
    );
  }

  const subtotal = getInvoiceSubtotal(invoice.items);
  const totalGst = getInvoiceTotalGst(invoice.items);
  const total = getInvoiceTotal(invoice.items);

  const handleDelete = () => {
    deleteInvoice(invoice.id);
    navigate("/");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{invoice.invoiceNumber}</h1>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <p className="text-sm text-muted-foreground">{invoice.clientName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-11 sm:ml-0">
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => generateInvoicePDF(invoice, seller)}>
            <Download className="h-3.5 w-3.5 mr-1" /> PDF
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-8 text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={handleDelete}>
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
          </Button>
        </div>
      </div>

      {/* Status Update */}
      <Card>
        <CardContent className="flex items-center justify-between py-3 px-4">
          <div>
            <p className="text-sm font-medium">Payment Status</p>
            <p className="text-xs text-muted-foreground">Update status</p>
          </div>
          <Select value={invoice.status} onValueChange={(v) => updateStatus(invoice.id, v as InvoiceStatus)}>
            <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Client Info */}
      <Card>
        <CardHeader className="px-4 pb-2"><CardTitle className="text-sm">Customer Details</CardTitle></CardHeader>
        <CardContent className="grid gap-1 text-sm px-4">
          <p className="font-medium">M/S {invoice.clientName}</p>
          <p className="text-muted-foreground text-xs">{invoice.clientAddress}</p>
          {invoice.clientPhone && <p className="text-muted-foreground text-xs">Phone: {invoice.clientPhone}</p>}
          {invoice.clientGstin && <p className="text-muted-foreground font-mono text-xs">GSTIN: {invoice.clientGstin}</p>}
          {invoice.placeOfSupply && <p className="text-muted-foreground text-xs">Place of Supply: {invoice.placeOfSupply}</p>}
        </CardContent>
      </Card>

      {/* Dates */}
      <Card>
        <CardContent className="flex flex-wrap gap-6 py-3 px-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Issue Date</p>
            <p className="font-medium text-sm">{new Date(invoice.issueDate).toLocaleDateString("en-IN")}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Due Date</p>
            <p className="font-medium text-sm">{new Date(invoice.dueDate).toLocaleDateString("en-IN")}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">GST Type</p>
            <p className="font-medium text-sm">{invoice.gstType === "intra" ? "CGST + SGST" : "IGST"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="px-4 pb-2"><CardTitle className="text-sm">Items</CardTitle></CardHeader>
        <CardContent className="px-4">
          <div className="space-y-2">
            {/* Mobile-friendly card layout for items */}
            {invoice.items.map((item) => (
              <div key={item.id} className="p-3 rounded-lg bg-muted/30 border text-sm">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <p className="font-medium">{item.itemName || item.description}</p>
                    {item.itemName && item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                  </div>
                  <p className="font-mono font-medium">{formatINR(getItemTaxableValue(item) + getItemGst(item))}</p>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {item.hsnSac && <span>HSN: {item.hsnSac}</span>}
                  <span>{item.quantity} {item.unit} × {formatINR(item.unitPrice)}</span>
                  <span>Taxable: {formatINR(getItemTaxableValue(item))}</span>
                  <span>GST {item.gstRate}%: {formatINR(getItemGst(item))}</span>
                </div>
              </div>
            ))}
            <div className="flex justify-end pt-3 border-t">
              <div className="text-right space-y-1 w-full sm:w-auto">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">Taxable Amount</span>
                  <span className="font-mono">{formatINR(subtotal)}</span>
                </div>
                {invoice.gstType === "intra" ? (
                  <>
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">CGST</span>
                      <span className="font-mono">{formatINR(totalGst / 2)}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-muted-foreground">SGST</span>
                      <span className="font-mono">{formatINR(totalGst / 2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">IGST</span>
                    <span className="font-mono">{formatINR(totalGst)}</span>
                  </div>
                )}
                <div className="flex justify-between gap-4 pt-2 border-t text-base font-bold">
                  <span>Total</span>
                  <span className="font-mono">{formatINR(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {invoice.notes && (
        <Card>
          <CardHeader className="px-4 pb-2"><CardTitle className="text-sm">Terms & Notes</CardTitle></CardHeader>
          <CardContent className="px-4">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
