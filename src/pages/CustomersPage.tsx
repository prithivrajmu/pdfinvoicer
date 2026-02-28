import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/stores/appStore";
import { Customer } from "@/types/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Plus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

const emptyForm = { name: "", phone: "", email: "", address: "", gstin: "", placeOfSupply: "" };

const CustomersPage = () => {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useAppStore();
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    if (editing) {
      await updateCustomer(userId, editing.id, form);
      toast.success("Customer updated");
    } else {
      await addCustomer(userId, form);
      toast.success("Customer added");
    }
    setForm(emptyForm);
    setEditing(null);
    setOpen(false);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone, email: c.email, address: c.address, gstin: c.gstin, placeOfSupply: c.placeOfSupply });
    setOpen(true);
  };

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true); };

  const handleDelete = async (id: string) => {
    await deleteCustomer(userId, id);
    toast.success("Customer deleted");
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Customers</h1>
              <p className="text-xs text-muted-foreground">{customers.length} saved</p>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="text-xs h-8" onClick={openNew}>
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle className="text-base">{editing ? "Edit" : "Add"} Customer</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div className="space-y-1"><Label className="text-xs">Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Customer name" className="h-9 text-sm" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" className="h-9 text-sm" /></div>
                  <div className="space-y-1"><Label className="text-xs">Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@co.in" className="h-9 text-sm" /></div>
                </div>
                <div className="space-y-1"><Label className="text-xs">GSTIN</Label><Input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })} placeholder="33AAHCR9756Q2ZE" maxLength={15} className="font-mono h-9 text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs">Address</Label><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full address" rows={2} className="text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs">Place of Supply</Label><Input value={form.placeOfSupply} onChange={(e) => setForm({ ...form, placeOfSupply: e.target.value })} placeholder="Tamil Nadu (33)" className="h-9 text-sm" /></div>
                <Button type="button" onClick={handleSave}>{editing ? "Update" : "Save"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {customers.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No customers yet. Add your first one!</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {customers.map((c) => (
              <Card key={c.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.phone}{c.email ? ` · ${c.email}` : ""}</p>
                    {c.gstin && <p className="text-xs text-muted-foreground font-mono">GSTIN: {c.gstin}</p>}
                    {c.address && <p className="text-xs text-muted-foreground truncate">{c.address}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {c.name}?</AlertDialogTitle>
                          <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(c.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomersPage;
