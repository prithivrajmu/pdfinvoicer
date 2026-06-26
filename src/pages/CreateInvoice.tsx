import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/stores/appStore";
import {
  GstType,
  Invoice,
  LineItem,
  getItemGst,
  getItemTaxableValue,
  getInvoiceSubtotal,
  getInvoiceTotal,
  getInvoiceTotalGst,
  formatINR,
} from "@/types/invoice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Package, Plus, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

const GST_RATES = [0, 5, 12, 18, 28];
const DEFAULT_DUE_DAYS = 30;

type EditorMode = "create" | "edit" | "duplicate";

interface SavedProduct {
  key: string;
  itemName: string;
  description: string;
  hsnSac: string;
  unit: string;
  unitPrice: number;
  gstRate: number;
}

type InvoiceDraft = Pick<
  Invoice,
  | "clientName"
  | "clientPhone"
  | "clientEmail"
  | "clientAddress"
  | "clientGstin"
  | "placeOfSupply"
  | "issueDate"
  | "dueDate"
  | "items"
  | "notes"
  | "gstType"
>;

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

const getDateOffset = (days: number) =>
  new Date(Date.now() + days * 86400000).toISOString().split("T")[0];

const normalizeProductName = (value: string) => value.trim().toLowerCase();

const buildSavedProducts = (invoices: Invoice[]): SavedProduct[] => {
  const productMap = new Map<string, SavedProduct>();
  const sortedInvoices = [...invoices].sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)
  );

  for (const invoice of sortedInvoices) {
    for (const item of invoice.items) {
      const itemName = item.itemName.trim();
      const key = normalizeProductName(itemName);
      if (!itemName || productMap.has(key)) continue;

      productMap.set(key, {
        key,
        itemName,
        description: item.description,
        hsnSac: item.hsnSac,
        unit: item.unit,
        unitPrice: item.unitPrice,
        gstRate: item.gstRate,
      });
    }
  }

  return [...productMap.values()];
};

const cloneItems = (items: LineItem[], regenerateIds: boolean) =>
  items.map((item) => ({
    ...item,
    id: regenerateIds ? crypto.randomUUID() : item.id,
  }));

const buildInitialDraft = (
  mode: EditorMode,
  defaultNotes: string,
  sourceInvoice?: Invoice
): InvoiceDraft => {
  if (sourceInvoice && mode !== "create") {
    return {
      clientName: sourceInvoice.clientName,
      clientPhone: sourceInvoice.clientPhone,
      clientEmail: sourceInvoice.clientEmail,
      clientAddress: sourceInvoice.clientAddress,
      clientGstin: sourceInvoice.clientGstin,
      placeOfSupply: sourceInvoice.placeOfSupply,
      issueDate: sourceInvoice.issueDate,
      dueDate: sourceInvoice.dueDate,
      items: cloneItems(sourceInvoice.items, mode === "duplicate"),
      notes: sourceInvoice.notes,
      gstType: sourceInvoice.gstType,
    };
  }

  return {
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    clientAddress: "",
    clientGstin: "",
    placeOfSupply: "",
    issueDate: getDateOffset(0),
    dueDate: getDateOffset(DEFAULT_DUE_DAYS),
    items: [createLineItem()],
    notes: defaultNotes,
    gstType: "intra",
  };
};

const getMode = (pathname: string): EditorMode => {
  if (pathname.endsWith("/edit")) return "edit";
  if (pathname.endsWith("/duplicate")) return "duplicate";
  return "create";
};

const pageMeta: Record<EditorMode, { title: string; submitLabel: string; successMessage: string }> = {
  create: {
    title: "New Tax Invoice",
    submitLabel: "Create Invoice",
    successMessage: "Invoice created!",
  },
  edit: {
    title: "Edit Invoice",
    submitLabel: "Save Changes",
    successMessage: "Invoice updated!",
  },
  duplicate: {
    title: "Duplicate Invoice",
    submitLabel: "Create Duplicate",
    successMessage: "Invoice duplicated!",
  },
};

const CreateInvoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const mode = getMode(location.pathname);
  const { userId } = useAuth();
  const {
    seller,
    customers,
    addInvoice,
    updateInvoice,
    addCustomer,
    getInvoice,
    nextInvoiceNumber,
    invoices,
    dataLoaded,
  } = useAppStore();

  const sourceInvoice = id ? getInvoice(id) : undefined;
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [draft, setDraft] = useState<InvoiceDraft>(() => buildInitialDraft("create", ""));
  const [savedProductPickerKey, setSavedProductPickerKey] = useState(0);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCust, setNewCust] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    gstin: "",
    placeOfSupply: "",
  });
  const savedProducts = buildSavedProducts(invoices);

  useEffect(() => {
    if (!dataLoaded) return;

    setDraft(buildInitialDraft(mode, seller.defaultNotes || "", sourceInvoice));
    setInvoiceNumber(
      mode === "edit" && sourceInvoice
        ? sourceInvoice.invoiceNumber
        : nextInvoiceNumber()
    );
  }, [dataLoaded, mode, seller.defaultNotes, sourceInvoice, nextInvoiceNumber]);

  function updateDraft<K extends keyof InvoiceDraft>(field: K, value: InvoiceDraft[K]) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  const selectCustomer = (customerId: string) => {
    const customer = customers.find((item) => item.id === customerId);
    if (!customer) return;

    setDraft((prev) => ({
      ...prev,
      clientName: customer.name,
      clientPhone: customer.phone,
      clientEmail: customer.email,
      clientAddress: customer.address,
      clientGstin: customer.gstin,
      placeOfSupply: customer.placeOfSupply,
    }));
  };

  const handleAddNewCustomer = async () => {
    if (!newCust.name.trim()) {
      toast.error("Customer name is required");
      return;
    }

    const customer = await addCustomer(userId, newCust);
    selectCustomer(customer.id);
    setShowNewCustomer(false);
    setNewCust({ name: "", phone: "", email: "", address: "", gstin: "", placeOfSupply: "" });
    toast.success("Customer saved!");
  };

  const updateItem = (itemId: string, field: keyof LineItem, value: string | number) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      ),
    }));
  };

  const applySavedProduct = (
    itemId: string,
    product: SavedProduct,
    options?: { preserveQuantity?: boolean }
  ) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              itemName: product.itemName,
              description: product.description,
              hsnSac: product.hsnSac,
              unit: product.unit,
              unitPrice: product.unitPrice,
              gstRate: product.gstRate,
              quantity: options?.preserveQuantity ? item.quantity : 1,
            }
          : item
      ),
    }));
  };

  const handleItemNameChange = (itemId: string, value: string) => {
    updateItem(itemId, "itemName", value);

    const matchedProduct = savedProducts.find(
      (product) => product.key === normalizeProductName(value)
    );

    if (matchedProduct) {
      applySavedProduct(itemId, matchedProduct, { preserveQuantity: true });
    }
  };

  const addLineItem = () => {
    setDraft((prev) => ({
      ...prev,
      items: [...prev.items, createLineItem()],
    }));
  };

  const addSavedProductLineItem = (productKey: string) => {
    const savedProduct = savedProducts.find((product) => product.key === productKey);
    if (!savedProduct) return;

    setDraft((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: crypto.randomUUID(),
          itemName: savedProduct.itemName,
          description: savedProduct.description,
          hsnSac: savedProduct.hsnSac,
          quantity: 1,
          unit: savedProduct.unit,
          unitPrice: savedProduct.unitPrice,
          gstRate: savedProduct.gstRate,
        },
      ],
    }));
    setSavedProductPickerKey((current) => current + 1);
  };

  const removeLineItem = (itemId: string) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }));
  };

  const subtotal = getInvoiceSubtotal(draft.items);
  const totalGst = getInvoiceTotalGst(draft.items);
  const total = getInvoiceTotal(draft.items);

  const syncCustomerIfNeeded = async () => {
    const normalizedName = draft.clientName.trim().toLowerCase();
    if (!normalizedName) return;

    const existing = customers.find(
      (customer) => customer.name.trim().toLowerCase() === normalizedName
    );

    if (!existing) {
      await addCustomer(userId, {
        name: draft.clientName,
        phone: draft.clientPhone,
        email: draft.clientEmail,
        address: draft.clientAddress,
        gstin: draft.clientGstin,
        placeOfSupply: draft.placeOfSupply,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date().toISOString();

    if (mode === "edit" && sourceInvoice) {
      const updatedInvoice: Invoice = {
        ...sourceInvoice,
        invoiceNumber,
        clientName: draft.clientName,
        clientPhone: draft.clientPhone,
        clientEmail: draft.clientEmail,
        clientAddress: draft.clientAddress,
        clientGstin: draft.clientGstin,
        placeOfSupply: draft.placeOfSupply,
        issueDate: draft.issueDate,
        dueDate: draft.dueDate,
        items: draft.items,
        notes: draft.notes,
        gstType: draft.gstType,
      };

      await updateInvoice(userId, updatedInvoice);
      await syncCustomerIfNeeded();
      toast.success(pageMeta[mode].successMessage);
      navigate(`/invoice/${updatedInvoice.id}`);
      return;
    }

    const invoice: Invoice = {
      id: crypto.randomUUID(),
      invoiceNumber,
      clientName: draft.clientName,
      clientPhone: draft.clientPhone,
      clientEmail: draft.clientEmail,
      clientAddress: draft.clientAddress,
      clientGstin: draft.clientGstin,
      placeOfSupply: draft.placeOfSupply,
      issueDate: draft.issueDate,
      dueDate: draft.dueDate,
      items: draft.items,
      notes: draft.notes,
      status: "draft",
      createdAt: now,
      gstType: draft.gstType,
      statusHistory: [
        {
          from: "draft",
          to: "draft",
          timestamp: now,
          note:
            mode === "duplicate" && sourceInvoice
              ? `Duplicated from ${sourceInvoice.invoiceNumber}`
              : "Invoice created",
        },
      ],
    };

    await addInvoice(userId, invoice);
    await syncCustomerIfNeeded();
    toast.success(pageMeta[mode].successMessage);
    navigate(mode === "duplicate" ? `/invoice/${invoice.id}` : "/");
  };

  if (!dataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-6">
        <div className="text-sm text-muted-foreground animate-pulse">Loading invoice editor...</div>
      </div>
    );
  }

  if ((mode === "edit" || mode === "duplicate") && !sourceInvoice) {
    return (
      <div className="min-h-screen bg-background px-4 py-6">
        <div className="max-w-3xl mx-auto text-center py-20 space-y-4">
          <p className="text-muted-foreground">Invoice not found.</p>
          <Button variant="outline" onClick={() => navigate("/")}>Go Back</Button>
        </div>
      </div>
    );
  }

  const meta = pageMeta[mode];

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-4 animate-fade-in pb-8">
        <div className="flex items-center gap-3 mb-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() =>
              mode === "edit" && sourceInvoice ? navigate(`/invoice/${sourceInvoice.id}`) : navigate("/")
            }
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{meta.title}</h1>
            <p className="text-sm text-muted-foreground font-mono">{invoiceNumber}</p>
            {mode === "duplicate" && sourceInvoice && (
              <p className="text-xs text-muted-foreground">Based on {sourceInvoice.invoiceNumber}</p>
            )}
          </div>
        </div>

        <Card className="bg-muted/50">
          <CardHeader className="pb-2 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">From (Your Details)</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => navigate("/settings")}
              >
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="text-sm space-y-0.5 px-4">
            {seller.businessName ? (
              <>
                <p className="font-semibold text-xs">{seller.businessName}</p>
                <p className="text-muted-foreground text-xs">{seller.name} · {seller.phone}</p>
                {seller.gstin && (
                  <p className="text-muted-foreground font-mono text-xs">GSTIN: {seller.gstin}</p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-xs">
                No business details.{" "}
                <button
                  type="button"
                  className="underline text-primary"
                  onClick={() => navigate("/settings")}
                >
                  Set up now
                </button>
              </p>
            )}
          </CardContent>
        </Card>

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
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
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
                    <DialogHeader>
                      <DialogTitle className="text-base">Add Customer</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3">
                      <Input
                        placeholder="Customer Name *"
                        value={newCust.name}
                        onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                      />
                      <Input
                        placeholder="Phone"
                        value={newCust.phone}
                        onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                      />
                      <Input
                        placeholder="Email"
                        value={newCust.email}
                        onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
                      />
                      <Input
                        placeholder="GSTIN"
                        value={newCust.gstin}
                        onChange={(e) =>
                          setNewCust({ ...newCust, gstin: e.target.value.toUpperCase() })
                        }
                        className="font-mono"
                        maxLength={15}
                      />
                      <Textarea
                        placeholder="Address"
                        value={newCust.address}
                        onChange={(e) => setNewCust({ ...newCust, address: e.target.value })}
                        rows={2}
                      />
                      <Input
                        placeholder="Place of Supply (e.g. Tamil Nadu)"
                        value={newCust.placeOfSupply}
                        onChange={(e) =>
                          setNewCust({ ...newCust, placeOfSupply: e.target.value })
                        }
                      />
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
              <Input
                required
                value={draft.clientName}
                onChange={(e) => updateDraft("clientName", e.target.value)}
                placeholder="Pleasant Days Hotel"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Phone</Label>
              <Input
                value={draft.clientPhone}
                onChange={(e) => updateDraft("clientPhone", e.target.value)}
                placeholder="9876543210"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                value={draft.clientEmail}
                onChange={(e) => updateDraft("clientEmail", e.target.value)}
                placeholder="billing@company.com"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">GSTIN</Label>
              <Input
                value={draft.clientGstin}
                onChange={(e) => updateDraft("clientGstin", e.target.value.toUpperCase())}
                placeholder="33AAHCR9756Q2ZE"
                maxLength={15}
                className="font-mono h-9 text-sm"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Address</Label>
              <Textarea
                value={draft.clientAddress}
                onChange={(e) => updateDraft("clientAddress", e.target.value)}
                placeholder="123 Main St, Chennai, Tamil Nadu"
                rows={2}
                className="text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-4 pb-3">
            <CardTitle className="text-sm">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 grid-cols-2 sm:grid-cols-4 px-4">
            <div className="space-y-1">
              <Label className="text-xs">Issue Date</Label>
              <Input
                type="date"
                required
                value={draft.issueDate}
                onChange={(e) => updateDraft("issueDate", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Due Date</Label>
              <Input
                type="date"
                required
                value={draft.dueDate}
                onChange={(e) => updateDraft("dueDate", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Place of Supply</Label>
              <Input
                value={draft.placeOfSupply}
                onChange={(e) => updateDraft("placeOfSupply", e.target.value)}
                placeholder="Tamil Nadu (33)"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">GST Type</Label>
              <Select
                value={draft.gstType}
                onValueChange={(value) => updateDraft("gstType", value as GstType)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="intra">CGST + SGST</SelectItem>
                  <SelectItem value="inter">IGST</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between px-4 pb-3">
            <CardTitle className="text-sm">Line Items</CardTitle>
            <div className="flex gap-1">
              {savedProducts.length > 0 && (
                <Select key={savedProductPickerKey} onValueChange={addSavedProductLineItem}>
                  <SelectTrigger className="h-7 text-xs w-auto gap-1">
                    <Package className="h-3 w-3" />
                    <SelectValue placeholder="Saved" />
                  </SelectTrigger>
                  <SelectContent>
                    {savedProducts.map((product) => (
                      <SelectItem key={product.key} value={product.key}>
                        {product.itemName} · {formatINR(product.unitPrice)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button type="button" variant="outline" size="sm" className="text-xs h-7" onClick={addLineItem}>
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-4">
            <datalist id="saved-product-names">
              {savedProducts.map((product) => (
                <option key={product.key} value={product.itemName} />
              ))}
            </datalist>
            {draft.items.map((item) => (
              <div key={item.id} className="space-y-2 p-3 rounded-lg bg-muted/30 border">
                <div className="grid grid-cols-2 sm:grid-cols-12 gap-2">
                  <div className="col-span-2 sm:col-span-4 space-y-1">
                    <Label className="text-xs text-muted-foreground">Item Name</Label>
                    <Input
                      required
                      list="saved-product-names"
                      value={item.itemName}
                      onChange={(e) => handleItemNameChange(item.id, e.target.value)}
                      placeholder="Dish Washing Gel"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-4 space-y-1">
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(item.id, "description", e.target.value)}
                      placeholder="5L container, lemon variant"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-2 space-y-1">
                    <Label className="text-xs text-muted-foreground">HSN/SAC</Label>
                    <Input
                      value={item.hsnSac}
                      onChange={(e) => updateItem(item.id, "hsnSac", e.target.value)}
                      placeholder="82055190"
                      className="font-mono h-9 text-sm"
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-2 space-y-1">
                    <Label className="text-xs text-muted-foreground">GST %</Label>
                    <Select
                      value={String(item.gstRate)}
                      onValueChange={(value) => updateItem(item.id, "gstRate", Number(value))}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GST_RATES.map((rate) => (
                          <SelectItem key={rate} value={String(rate)}>
                            {rate}%
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-end">
                  <div className="col-span-1 sm:col-span-2 space-y-1">
                    <Label className="text-xs text-muted-foreground">Qty</Label>
                    <Input
                      type="number"
                      min={0.01}
                      step={0.01}
                      required
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-2 space-y-1">
                    <Label className="text-xs text-muted-foreground">Unit</Label>
                    <Input
                      value={item.unit}
                      onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                      placeholder="NOS"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-3 space-y-1">
                    <Label className="text-xs text-muted-foreground">Rate (₹)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      required
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, "unitPrice", Number(e.target.value))}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-3 space-y-1">
                    <Label className="text-xs text-muted-foreground">Taxable</Label>
                    <p className="text-sm font-mono font-medium py-1.5">{formatINR(getItemTaxableValue(item))}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-2 flex items-center justify-between sm:justify-end gap-1">
                    <span className="text-xs text-muted-foreground">Tax: {formatINR(getItemGst(item))}</span>
                    {draft.items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeLineItem(item.id)}
                      >
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
                {draft.gstType === "intra" ? (
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
            <Textarea
              value={draft.notes}
              onChange={(e) => updateDraft("notes", e.target.value)}
              placeholder="Payment terms, conditions..."
              rows={3}
              className="text-sm"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 pb-8">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              mode === "edit" && sourceInvoice ? navigate(`/invoice/${sourceInvoice.id}`) : navigate("/")
            }
          >
            Cancel
          </Button>
          <Button type="submit" size="sm">{meta.submitLabel}</Button>
        </div>
      </form>
    </div>
  );
};

export default CreateInvoice;
