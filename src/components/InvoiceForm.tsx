import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Invoice, LineItem, GstType, getItemTaxableValue, getItemGst, getInvoiceSubtotal, getInvoiceTotalGst, getInvoiceTotal, formatINR } from "@/types/invoice";
import { SellerDetails } from "@/types/invoice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowLeft } from "lucide-react";

interface InvoiceFormProps {
  invoiceNumber: string;
  seller: SellerDetails;
  onSubmit: (invoice: Invoice) => void;
}

const GST_RATES = [0, 5, 12, 18, 28];

const createLineItem = (): LineItem => ({
  id: crypto.randomUUID(),
  description: "",
  hsnSac: "",
  quantity: 1,
  unit: "NOS",
  unitPrice: 0,
  gstRate: 18,
});

export const InvoiceForm = ({ invoiceNumber, seller, onSubmit }: InvoiceFormProps) => {
  const navigate = useNavigate();
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientGstin, setClientGstin] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("");
  const [gstType, setGstType] = useState<GstType>("intra");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]
  );
  const [items, setItems] = useState<LineItem[]>([createLineItem()]);
  const [notes, setNotes] = useState("");

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const subtotal = getInvoiceSubtotal(items);
  const totalGst = getInvoiceTotalGst(items);
  const total = getInvoiceTotal(items);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const invoice: Invoice = {
      id: crypto.randomUUID(),
      invoiceNumber,
      clientName,
      clientPhone,
      clientEmail,
      clientAddress,
      clientGstin,
      placeOfSupply,
      issueDate,
      dueDate,
      items,
      notes,
      status: "draft",
      createdAt: new Date().toISOString(),
      gstType,
    };
    onSubmit(invoice);
    navigate("/");
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <Button type="button" variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Tax Invoice</h1>
          <p className="text-sm text-muted-foreground font-mono">{invoiceNumber}</p>
        </div>
      </div>

      {/* Seller Preview */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">From (Your Details)</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => navigate("/settings")}>
              Edit Details
            </Button>
          </div>
        </CardHeader>
        <CardContent className="text-sm space-y-0.5">
          {seller.businessName ? (
            <>
              <p className="font-semibold">{seller.businessName}</p>
              <p className="text-muted-foreground">{seller.name} · {seller.phone}</p>
              <p className="text-muted-foreground">{seller.address}, {seller.cityState} - {seller.pincode}</p>
              {seller.gstin && <p className="text-muted-foreground font-mono text-xs">GSTIN: {seller.gstin}</p>}
            </>
          ) : (
            <p className="text-muted-foreground">No business details set. <button type="button" className="underline text-primary" onClick={() => navigate("/settings")}>Set up now</button></p>
          )}
        </CardContent>
      </Card>

      {/* Customer Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Customer Name (M/S)</Label>
            <Input required value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Pleasant Days Hotel" />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="9876543210" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="billing@company.com" />
          </div>
          <div className="space-y-2">
            <Label>GSTIN</Label>
            <Input value={clientGstin} onChange={(e) => setClientGstin(e.target.value.toUpperCase())} placeholder="33AAHCR9756Q2ZE" maxLength={15} className="font-mono" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Address</Label>
            <Textarea value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} placeholder="123 Main St, Chennai, Tamil Nadu" rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* GST & Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Issue Date</Label>
            <Input type="date" required value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Place of Supply</Label>
            <Input value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)} placeholder="Tamil Nadu (33)" />
          </div>
          <div className="space-y-2">
            <Label>GST Type</Label>
            <Select value={gstType} onValueChange={(v) => setGstType(v as GstType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="intra">Intra-State (CGST + SGST)</SelectItem>
                <SelectItem value="inter">Inter-State (IGST)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Line Items</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => setItems((p) => [...p, createLineItem()])}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item, idx) => (
            <div key={item.id} className="space-y-2 p-3 rounded-lg bg-muted/30 border">
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-6 space-y-1">
                  {idx === 0 && <Label className="text-xs text-muted-foreground">Description</Label>}
                  <Input required value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} placeholder="Product / Service name" />
                </div>
                <div className="col-span-3 space-y-1">
                  {idx === 0 && <Label className="text-xs text-muted-foreground">HSN / SAC</Label>}
                  <Input value={item.hsnSac} onChange={(e) => updateItem(item.id, "hsnSac", e.target.value)} placeholder="82055190" className="font-mono" />
                </div>
                <div className="col-span-3 space-y-1">
                  {idx === 0 && <Label className="text-xs text-muted-foreground">GST Rate %</Label>}
                  <Select value={String(item.gstRate)} onValueChange={(v) => updateItem(item.id, "gstRate", Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GST_RATES.map((r) => <SelectItem key={r} value={String(r)}>{r}%</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs text-muted-foreground">Qty</Label>
                  <Input type="number" min={0.01} step={0.01} required value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))} />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs text-muted-foreground">Unit</Label>
                  <Input value={item.unit} onChange={(e) => updateItem(item.id, "unit", e.target.value)} placeholder="NOS" />
                </div>
                <div className="col-span-3 space-y-1">
                  <Label className="text-xs text-muted-foreground">Rate (₹)</Label>
                  <Input type="number" min={0} step={0.01} required value={item.unitPrice} onChange={(e) => updateItem(item.id, "unitPrice", Number(e.target.value))} />
                </div>
                <div className="col-span-3 space-y-1">
                  <Label className="text-xs text-muted-foreground">Taxable</Label>
                  <p className="text-sm font-mono font-medium py-2">{formatINR(getItemTaxableValue(item))}</p>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-1">
                  <span className="text-xs text-muted-foreground">Tax: {formatINR(getItemGst(item))}</span>
                  {items.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setItems((p) => p.filter((i) => i.id !== item.id))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-end pt-3 border-t">
            <div className="text-right space-y-1">
              <div className="flex justify-between gap-8 text-sm">
                <span className="text-muted-foreground">Taxable Amount</span>
                <span className="font-mono">{formatINR(subtotal)}</span>
              </div>
              {gstType === "intra" ? (
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Terms & Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Payment terms, conditions..." rows={3} />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pb-8">
        <Button type="button" variant="outline" onClick={() => navigate("/")}>Cancel</Button>
        <Button type="submit">Create Invoice</Button>
      </div>
    </form>
  );
};
