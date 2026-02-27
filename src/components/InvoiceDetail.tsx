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
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <p className="text-sm text-muted-foreground">{invoice.clientName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => generateInvoicePDF(invoice, seller)}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> PDF
          </Button>
          <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={handleDelete}>
            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
          </Button>
        </div>
      </div>

      {/* Status Update */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="text-sm font-medium">Payment Status</p>
            <p className="text-xs text-muted-foreground">Update the status of this invoice</p>
          </div>
          <Select value={invoice.status} onValueChange={(v) => updateStatus(invoice.id, v as InvoiceStatus)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
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
        <CardHeader><CardTitle className="text-base">Customer Details</CardTitle></CardHeader>
        <CardContent className="grid gap-1 text-sm">
          <p className="font-medium">M/S {invoice.clientName}</p>
          <p className="text-muted-foreground">{invoice.clientAddress}</p>
          {invoice.clientPhone && <p className="text-muted-foreground">Phone: {invoice.clientPhone}</p>}
          {invoice.clientGstin && <p className="text-muted-foreground font-mono text-xs">GSTIN: {invoice.clientGstin}</p>}
          {invoice.placeOfSupply && <p className="text-muted-foreground text-xs">Place of Supply: {invoice.placeOfSupply}</p>}
        </CardContent>
      </Card>

      {/* Dates */}
      <Card>
        <CardContent className="flex gap-8 py-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Issue Date</p>
            <p className="font-medium">{new Date(invoice.issueDate).toLocaleDateString("en-IN")}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Due Date</p>
            <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString("en-IN")}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">GST Type</p>
            <p className="font-medium">{invoice.gstType === "intra" ? "CGST + SGST" : "IGST"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader><CardTitle className="text-base">Items</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 overflow-x-auto">
            <div className="grid grid-cols-12 text-xs text-muted-foreground font-medium uppercase tracking-wider pb-2 border-b min-w-[600px]">
              <span className="col-span-4">Description</span>
              <span className="col-span-1">HSN</span>
              <span className="col-span-1 text-center">Qty</span>
              <span className="col-span-2 text-right">Rate</span>
              <span className="col-span-2 text-right">Taxable</span>
              <span className="col-span-2 text-right">GST</span>
            </div>
            {invoice.items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 text-sm py-2 min-w-[600px]">
                <span className="col-span-4">{item.description}</span>
                <span className="col-span-1 font-mono text-xs">{item.hsnSac}</span>
                <span className="col-span-1 text-center font-mono">{item.quantity} {item.unit}</span>
                <span className="col-span-2 text-right font-mono">{formatINR(item.unitPrice)}</span>
                <span className="col-span-2 text-right font-mono">{formatINR(getItemTaxableValue(item))}</span>
                <span className="col-span-2 text-right font-mono text-xs">{item.gstRate}% = {formatINR(getItemGst(item))}</span>
              </div>
            ))}
            <div className="flex justify-end pt-4 border-t">
              <div className="text-right space-y-1">
                <div className="flex justify-between gap-8 text-sm">
                  <span className="text-muted-foreground">Taxable Amount</span>
                  <span className="font-mono">{formatINR(subtotal)}</span>
                </div>
                {invoice.gstType === "intra" ? (
                  <>
                    <div className="flex justify-between gap-8 text-sm">
                      <span className="text-muted-foreground">CGST</span>
                      <span className="font-mono">{formatINR(totalGst / 2)}</span>
                    </div>
                    <div className="flex justify-between gap-8 text-sm">
                      <span className="text-muted-foreground">SGST</span>
                      <span className="font-mono">{formatINR(totalGst / 2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between gap-8 text-sm">
                    <span className="text-muted-foreground">IGST</span>
                    <span className="font-mono">{formatINR(totalGst)}</span>
                  </div>
                )}
                <div className="flex justify-between gap-8 pt-2 border-t text-lg font-bold">
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
          <CardHeader><CardTitle className="text-base">Terms & Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
