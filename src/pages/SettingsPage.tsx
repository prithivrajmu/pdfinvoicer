import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/stores/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Save, Download, Upload, CloudUpload, CloudDownload } from "lucide-react";
import { toast } from "sonner";
import { exportToJSON, importFromJSON } from "@/lib/backup";
import { backupToGoogleDrive, restoreFromGoogleDrive, isGISAvailable } from "@/lib/gdrive-backup";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { seller, updateSeller, loadData } = useAppStore();
  const importRef = useRef<HTMLInputElement>(null);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Business details saved!");
    navigate("/");
  };

  const handleExport = async () => {
    try {
      await exportToJSON(userId);
      toast.success("Backup downloaded!");
    } catch { toast.error("Export failed"); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await importFromJSON(userId, file);
      await loadData(userId);
      toast.success(`Imported ${result.invoiceCount} invoices, ${result.customerCount} customers`);
    } catch { toast.error("Import failed: invalid file"); }
    if (importRef.current) importRef.current.value = "";
  };

  const handleGDriveBackup = async () => {
    setBackingUp(true);
    try {
      await backupToGoogleDrive(userId);
      toast.success("Backed up to Google Drive!");
    } catch (err: any) { toast.error(err.message || "Backup failed"); }
    finally { setBackingUp(false); }
  };

  const handleGDriveRestore = async () => {
    setRestoring(true);
    try {
      const result = await restoreFromGoogleDrive(userId);
      if (!result) { toast.info("No backup found on Google Drive"); return; }
      await loadData(userId);
      toast.success(`Restored ${result.invoiceCount} invoices, ${result.customerCount} customers`);
    } catch (err: any) { toast.error(err.message || "Restore failed"); }
    finally { setRestoring(false); }
  };

  const handleUpdate = (updates: Record<string, string>) => {
    updateSeller(userId, updates);
  };

  const gisAvailable = isGISAvailable();

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <form onSubmit={handleSave} className="max-w-2xl mx-auto space-y-4 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <Button type="button" variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Settings</h1>
            <p className="text-xs text-muted-foreground">Business details & data management</p>
          </div>
        </div>

        <Card>
          <CardHeader className="px-4 pb-3"><CardTitle className="text-sm">Business Information</CardTitle><CardDescription className="text-xs">Appears at the top of your invoices</CardDescription></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 px-4">
            <div className="space-y-1 sm:col-span-2"><Label className="text-xs">Business Name</Label><Input required value={seller.businessName} onChange={(e) => handleUpdate({ businessName: e.target.value })} placeholder="Ishvarya Hospitality Solutions" className="h-9 text-sm" /></div>
            <div className="space-y-1"><Label className="text-xs">Your Name</Label><Input required value={seller.name} onChange={(e) => handleUpdate({ name: e.target.value })} placeholder="Vel Vadivu" className="h-9 text-sm" /></div>
            <div className="space-y-1"><Label className="text-xs">Phone</Label><Input value={seller.phone} onChange={(e) => handleUpdate({ phone: e.target.value })} placeholder="9876543210" className="h-9 text-sm" /></div>
            <div className="space-y-1"><Label className="text-xs">Email</Label><Input type="email" value={seller.email} onChange={(e) => handleUpdate({ email: e.target.value })} placeholder="you@business.com" className="h-9 text-sm" /></div>
            <div className="space-y-1"><Label className="text-xs">GSTIN</Label><Input value={seller.gstin} onChange={(e) => handleUpdate({ gstin: e.target.value.toUpperCase() })} placeholder="22ABCDE1234F1Z5" maxLength={15} className="font-mono h-9 text-sm" /></div>
            <div className="space-y-1 sm:col-span-2"><Label className="text-xs">Address</Label><Textarea value={seller.address} onChange={(e) => handleUpdate({ address: e.target.value })} placeholder="917, Selvapuram Alagapuram Pudur" rows={2} className="text-sm" /></div>
            <div className="space-y-1"><Label className="text-xs">City, State</Label><Input value={seller.cityState} onChange={(e) => handleUpdate({ cityState: e.target.value })} placeholder="Salem, Tamil Nadu" className="h-9 text-sm" /></div>
            <div className="space-y-1"><Label className="text-xs">Pincode</Label><Input value={seller.pincode} onChange={(e) => handleUpdate({ pincode: e.target.value })} placeholder="636016" maxLength={6} className="h-9 text-sm" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-4 pb-3"><CardTitle className="text-sm">Payment Details</CardTitle><CardDescription className="text-xs">Bank details shown on invoices</CardDescription></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 px-4">
            <div className="space-y-1 sm:col-span-2"><Label className="text-xs">Bank Name</Label><Input value={seller.bankName} onChange={(e) => handleUpdate({ bankName: e.target.value })} placeholder="State Bank of India" className="h-9 text-sm" /></div>
            <div className="space-y-1"><Label className="text-xs">Account Number</Label><Input value={seller.accountNumber} onChange={(e) => handleUpdate({ accountNumber: e.target.value })} placeholder="1234567890" className="font-mono h-9 text-sm" /></div>
            <div className="space-y-1"><Label className="text-xs">IFSC Code</Label><Input value={seller.ifsc} onChange={(e) => handleUpdate({ ifsc: e.target.value.toUpperCase() })} placeholder="SBIN0001234" className="font-mono h-9 text-sm" /></div>
            <div className="space-y-1 sm:col-span-2"><Label className="text-xs">UPI ID (optional)</Label><Input value={seller.upiId} onChange={(e) => handleUpdate({ upiId: e.target.value })} placeholder="business@upi" className="h-9 text-sm" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-4 pb-3"><CardTitle className="text-sm">Default Invoice Notes</CardTitle></CardHeader>
          <CardContent className="px-4">
            <Textarea value={seller.defaultNotes} onChange={(e) => handleUpdate({ defaultNotes: e.target.value })} placeholder="E.g. Payment due within 30 days." rows={3} className="text-sm" />
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader className="px-4 pb-3"><CardTitle className="text-sm">Data Management</CardTitle><CardDescription className="text-xs">Backup and restore your data</CardDescription></CardHeader>
          <CardContent className="space-y-3 px-4">
            {gisAvailable && (
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="text-xs h-8 flex-1" onClick={handleGDriveBackup} disabled={backingUp}>
                  <CloudUpload className="h-3.5 w-3.5 mr-1.5" />{backingUp ? "Backing up..." : "Backup to Google Drive"}
                </Button>
                <Button type="button" variant="outline" size="sm" className="text-xs h-8 flex-1" onClick={handleGDriveRestore} disabled={restoring}>
                  <CloudDownload className="h-3.5 w-3.5 mr-1.5" />{restoring ? "Restoring..." : "Restore from Drive"}
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="text-xs h-8 flex-1" onClick={handleExport}>
                <Download className="h-3.5 w-3.5 mr-1.5" />Export JSON
              </Button>
              <Button type="button" variant="outline" size="sm" className="text-xs h-8 flex-1" onClick={() => importRef.current?.click()}>
                <Upload className="h-3.5 w-3.5 mr-1.5" />Import JSON
              </Button>
              <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            </div>
            <p className="text-[11px] text-muted-foreground">Your data is stored locally in IndexedDB. Export regularly to avoid data loss.</p>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 pb-8">
          <Button type="button" variant="outline" size="sm" onClick={() => navigate("/")}>Cancel</Button>
          <Button type="submit" size="sm"><Save className="h-3.5 w-3.5 mr-1.5" /> Save</Button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
