import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Invoice, LineItem, GstType, getItemTaxableValue, getItemGst, getInvoiceSubtotal, getInvoiceTotalGst, getInvoiceTotal, formatINR } from "@/types/invoice";
import { SellerDetails } from "@/types/invoice";
import { Customer } from "@/types/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, ArrowLeft, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

interface InvoiceFormProps {
  invoiceNumber: string;
  seller: SellerDetails;
  customers: Customer[];
  addCustomer: (c: Omit<Customer, "id">) => Customer;
  onSubmit: (invoice: Invoice) => void;
}

const GST_RATES = [0, 5, 12, 18, 28];

const createLineItem = (): LineItem => ({
  id: crypto.randomUUID(),
  itemName: "",
  description: "",
  hsnSac: "",
  quantity: 1,
  unit: "NOS",
  unitPrice: 0,
  gstRate: 18,
});

export const InvoiceForm = ({ invoiceNumber, seller, customers, addCustomer, onSubmit }: InvoiceFormProps) => {
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
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCust, setNewCust] = useState({ name: "", phone: "", email: "", address: "", gstin: "", placeOfSupply: "" });

  const selectCustomer = (customerId: string) => {
    const c = customers.find((cu) => cu.id === customerId);
    if (!c) return;
    setClientName(c.name);
    setClientPhone(c.phone);
    setClientEmail(c.email);
    setClientAddress(c.address);
    setClientGstin(c.gstin);
    setPlaceOfSupply(c.placeOfSupply);
  };

  const handleAddNewCustomer = () => {
    if (!newCust.name.trim()) { toast.error("Customer name is required"); return; }
    const c = addCustomer(newCust);
    selectCustomer(c.id);
    setShowNewCustomer(false);
    setNewCust({ name: "", phone: "", email: "", address: "", gstin: "", placeOfSupply: "" });
    toast.success("Customer saved!");
  };

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
    // Save customer if new
    if (!customers.find((c) => c.name === clientName)) {
      addCustomer({ name: clientName, phone: clientPhone, email: clientEmail, address: clientAddress, gstin: clientGstin, placeOfSupply });
    }
    navigate("/");
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-4 animate-fade-in pb-8">
      <div className="flex items-center gap-3 mb-2">
        <Button type="button" variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">New Tax Invoice</h1>
          <p className="text-sm text-muted-foreground font-mono">{invoiceNumber}</p>
        </div>
      </div>

      {/* Seller Preview */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-2 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">From (Your Details)</CardTitle>
            <Button type="button" variant="outline" size="sm" className="text-xs h-7" onClick={() => navigate("/settings")}>Edit</Button>
          </div>
        </CardHeader>
        <CardContent className="text-sm space-y-0.5 px-4">
          {seller.businessName ? (
            <>
              <p className="font-semibold text-xs">{seller.businessName}</p>
              <p className="text-muted-foreground text-xs">{seller.name} · {seller.phone}</p>
              {seller.gstin && <p className="text-muted-foreground font-mono text-xs">GSTIN: {seller.gstin}</p>}
            </>
          ) : (
            <p className="text-muted-foreground text-xs">No business details. <button type="button" className="underline text-primary" onClick={() => navigate("/settings")}>Set up now</button></p>
          )}
        </CardContent>
      </Card>

      {/* Customer Details */}
      <Card>
        <CardHeader className="px-4 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Customer Details</CardTitle>
            <div className="flex gap-1">
              {customers.length > 0 && (
                <Select onValueChange={selectCustomer}>
                  <SelectTrigger className="h-7 text-xs w-auto gap-1">
                    <Users className="h-3 w-3" />
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Dialog open={showNewCustomer} onOpenChange={setShowNewCustomer}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="text-xs h-7">
                    <UserPlus className="h-3 w-3 mr-1" /> New
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader><DialogTitle className="text-base">Add Customer</DialogTitle></DialogHeader>
                  <div className="grid gap-3">
                    <Input placeholder="Customer Name *" value={newCust.name} onChange={(e) => setNewCust({ ...newCust, name: e.target.value })} />
                    <Input placeholder="Phone" value={newCust.phone} onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })} />
                    <Input placeholder="Email" value={newCust.email} onChange={(e) => setNewCust({ ...newCust, email: e.target.value })} />
                    <Input placeholder="GSTIN" value={newCust.gstin} onChange={(e) => setNewCust({ ...newCust, gstin: e.target.value.toUpperCase() })} className="font-mono" maxLength={15} />
                    <Textarea placeholder="Address" value={newCust.address} onChange={(e) => setNewCust({ ...newCust, address: e.target.value })} rows={2} />
                    <Input placeholder="Place of Supply (e.g. Tamil Nadu)" value={newCust.placeOfSupply} onChange={(e) => setNewCust({ ...newCust, placeOfSupply: e.target.value })} />
                    <Button type="button" onClick={handleAddNewCustomer}>Save Customer</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 grid-cols-1 sm:grid-cols-2 px-4">
          <div className="space-y-1">
            <Label className="text-xs">Customer Name (M/S)</Label>
            <Input required value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Pleasant Days Hotel" className="h-9 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Phone</Label>
            <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="9876543210" className="h-9 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Email</Label>
            <Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="billing@company.com" className="h-9 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">GSTIN</Label>
            <Input value={clientGstin} onChange={(e) => setClientGstin(e.target.value.toUpperCase())} placeholder="33AAHCR9756Q2ZE" maxLength={15} className="font-mono h-9 text-sm" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">Address</Label>
            <Textarea value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} placeholder="123 Main St, Chennai, Tamil Nadu" rows={2} className="text-sm" />
          </div>
        </CardContent>
      </Card>

      {/* GST & Dates */}
      <Card>
        <CardHeader className="px-4 pb-3">
          <CardTitle className="text-sm">Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 grid-cols-2 sm:grid-cols-4 px-4">
          <div className="space-y-1">
            <Label className="text-xs">Issue Date</Label>
            <Input type="date" required value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="h-9 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Due Date</Label>
            <Input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-9 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Place of Supply</Label>
            <Input value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)} placeholder="Tamil Nadu (33)" className="h-9 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">GST Type</Label>
            <Select value={gstType} onValueChange={(v) => setGstType(v as GstType)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="intra">CGST + SGST</SelectItem>
                <SelectItem value="inter">IGST</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between px-4 pb-3">
          <CardTitle className="text-sm">Line Items</CardTitle>
          <Button type="button" variant="outline" size="sm" className="text-xs h-7" onClick={() => setItems((p) => [...p, createLineItem()])}>
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 px-4">
          {items.map((item, idx) => (
            <div key={item.id} className="space-y-2 p-3 rounded-lg bg-muted/30 border">
              <div className="grid grid-cols-2 sm:grid-cols-12 gap-2">
                <div className="col-span-2 sm:col-span-4 space-y-1">
                  <Label className="text-xs text-muted-foreground">Item Name</Label>
                  <Input required value={item.itemName} onChange={(e) => updateItem(item.id, "itemName", e.target.value)} placeholder="Dish Washing Gel" className="h-9 text-sm" />
                </div>
                <div className="col-span-2 sm:col-span-4 space-y-1">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Input value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} placeholder="5L container, lemon variant" className="h-9 text-sm" />
                </div>
                <div className="col-span-1 sm:col-span-2 space-y-1">
                  <Label className="text-xs text-muted-foreground">HSN/SAC</Label>
                  <Input value={item.hsnSac} onChange={(e) => updateItem(item.id, "hsnSac", e.target.value)} placeholder="82055190" className="font-mono h-9 text-sm" />
                </div>
                <div className="col-span-1 sm:col-span-2 space-y-1">
                  <Label className="text-xs text-muted-foreground">GST %</Label>
                  <Select value={String(item.gstRate)} onValueChange={(v) => updateItem(item.id, "gstRate", Number(v))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GST_RATES.map((r) => <SelectItem key={r} value={String(r)}>{r}%</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-end">
                <div className="col-span-1 sm:col-span-2 space-y-1">
                  <Label className="text-xs text-muted-foreground">Qty</Label>
                  <Input type="number" min={0.01} step={0.01} required value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))} className="h-9 text-sm" />
                </div>
                <div className="col-span-1 sm:col-span-2 space-y-1">
                  <Label className="text-xs text-muted-foreground">Unit</Label>
                  <Input value={item.unit} onChange={(e) => updateItem(item.id, "unit", e.target.value)} placeholder="NOS" className="h-9 text-sm" />
                </div>
                <div className="col-span-1 sm:col-span-3 space-y-1">
                  <Label className="text-xs text-muted-foreground">Rate (₹)</Label>
                  <Input type="number" min={0} step={0.01} required value={item.unitPrice} onChange={(e) => updateItem(item.id, "unitPrice", Number(e.target.value))} className="h-9 text-sm" />
                </div>
                <div className="col-span-1 sm:col-span-3 space-y-1">
                  <Label className="text-xs text-muted-foreground">Taxable</Label>
                  <p className="text-sm font-mono font-medium py-1.5">{formatINR(getItemTaxableValue(item))}</p>
                </div>
                <div className="col-span-2 sm:col-span-2 flex items-center justify-between sm:justify-end gap-1">
                  <span className="text-xs text-muted-foreground">Tax: {formatINR(getItemGst(item))}</span>
                  {items.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => setItems((p) => p.filter((i) => i.id !== item.id))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-end pt-3 border-t">
            <div className="text-right space-y-1 w-full sm:w-auto">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Taxable Amount</span>
                <span className="font-mono">{formatINR(subtotal)}</span>
              </div>
              {gstType === "intra" ? (
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
              <div className="flex justify-between gap-4 pt-2 border-t text-base sm:text-lg font-bold">
                <span>Total</span>
                <span className="font-mono">{formatINR(total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="px-4 pb-3">
          <CardTitle className="text-sm">Terms & Notes</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Payment terms, conditions..." rows={3} className="text-sm" />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 pb-8">
        <Button type="button" variant="outline" size="sm" onClick={() => navigate("/")}>Cancel</Button>
        <Button type="submit" size="sm">Create Invoice</Button>
      </div>
    </form>
  );
};
