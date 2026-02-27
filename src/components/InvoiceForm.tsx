import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Invoice, LineItem } from "@/types/invoice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ArrowLeft } from "lucide-react";

interface InvoiceFormProps {
  invoiceNumber: string;
  onSubmit: (invoice: Invoice) => void;
}

const createLineItem = (): LineItem => ({
  id: crypto.randomUUID(),
  description: "",
  quantity: 1,
  unitPrice: 0,
});

export const InvoiceForm = ({ invoiceNumber, onSubmit }: InvoiceFormProps) => {
  const navigate = useNavigate();
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
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

  const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const invoice: Invoice = {
      id: crypto.randomUUID(),
      invoiceNumber,
      clientName,
      clientEmail,
      clientAddress,
      issueDate,
      dueDate,
      items,
      notes,
      status: "draft",
      createdAt: new Date().toISOString(),
    };
    onSubmit(invoice);
    navigate("/");
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <Button type="button" variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Invoice</h1>
          <p className="text-sm text-muted-foreground font-mono">{invoiceNumber}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Client Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Client Name</Label>
            <Input required value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Acme Corp" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" required value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="billing@acme.com" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Address</Label>
            <Textarea value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} placeholder="123 Main St, City, Country" rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dates</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Issue Date</Label>
            <Input type="date" required value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Line Items</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => setItems((p) => [...p, createLineItem()])}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item, idx) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-5 space-y-1">
                {idx === 0 && <Label className="text-xs text-muted-foreground">Description</Label>}
                <Input
                  required
                  value={item.description}
                  onChange={(e) => updateItem(item.id, "description", e.target.value)}
                  placeholder="Service description"
                />
              </div>
              <div className="col-span-2 space-y-1">
                {idx === 0 && <Label className="text-xs text-muted-foreground">Qty</Label>}
                <Input
                  type="number"
                  min={1}
                  required
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                />
              </div>
              <div className="col-span-3 space-y-1">
                {idx === 0 && <Label className="text-xs text-muted-foreground">Unit Price</Label>}
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  required
                  value={item.unitPrice}
                  onChange={(e) => updateItem(item.id, "unitPrice", Number(e.target.value))}
                />
              </div>
              <div className="col-span-2 flex items-center justify-between">
                <span className="text-sm font-mono font-medium">
                  ${(item.quantity * item.unitPrice).toFixed(2)}
                </span>
                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setItems((p) => p.filter((i) => i.id !== item.id))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          <div className="flex justify-end pt-3 border-t">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold font-mono">${total.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Payment terms, thank you note..." rows={3} />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pb-8">
        <Button type="button" variant="outline" onClick={() => navigate("/")}>Cancel</Button>
        <Button type="submit">Create Invoice</Button>
      </div>
    </form>
  );
};
