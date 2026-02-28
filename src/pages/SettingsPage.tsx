import { useNavigate } from "react-router-dom";
import { SellerDetails } from "@/types/invoice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

interface SettingsPageProps {
  seller: SellerDetails;
  updateSeller: (updates: Partial<SellerDetails>) => void;
}

const SettingsPage = ({ seller, updateSeller }: SettingsPageProps) => {
  const navigate = useNavigate();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Business details saved!");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <form onSubmit={handleSave} className="max-w-2xl mx-auto space-y-4 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <Button type="button" variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Business Settings</h1>
            <p className="text-xs text-muted-foreground">Your details appear on all invoices</p>
          </div>
        </div>

        <Card>
          <CardHeader className="px-4 pb-3">
            <CardTitle className="text-sm">Business Information</CardTitle>
            <CardDescription className="text-xs">Appears at the top of your invoices</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 px-4">
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Business Name</Label>
              <Input required value={seller.businessName} onChange={(e) => updateSeller({ businessName: e.target.value })} placeholder="Ishvarya Hospitality Solutions" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Your Name</Label>
              <Input required value={seller.name} onChange={(e) => updateSeller({ name: e.target.value })} placeholder="Vel Vadivu" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Phone</Label>
              <Input value={seller.phone} onChange={(e) => updateSeller({ phone: e.target.value })} placeholder="9487519401" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input type="email" value={seller.email} onChange={(e) => updateSeller({ email: e.target.value })} placeholder="you@business.com" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">GSTIN</Label>
              <Input value={seller.gstin} onChange={(e) => updateSeller({ gstin: e.target.value.toUpperCase() })} placeholder="33AQBPM0647A1ZJ" maxLength={15} className="font-mono h-9 text-sm" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Address</Label>
              <Textarea value={seller.address} onChange={(e) => updateSeller({ address: e.target.value })} placeholder="917, Selvapuram Alagapuram Pudur" rows={2} className="text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">City, State</Label>
              <Input value={seller.cityState} onChange={(e) => updateSeller({ cityState: e.target.value })} placeholder="Salem, Tamil Nadu" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Pincode</Label>
              <Input value={seller.pincode} onChange={(e) => updateSeller({ pincode: e.target.value })} placeholder="636016" maxLength={6} className="h-9 text-sm" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-4 pb-3">
            <CardTitle className="text-sm">Payment Details</CardTitle>
            <CardDescription className="text-xs">Bank details shown on invoices for payment</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 px-4">
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Bank Name</Label>
              <Input value={seller.bankName} onChange={(e) => updateSeller({ bankName: e.target.value })} placeholder="State Bank of India" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Account Number</Label>
              <Input value={seller.accountNumber} onChange={(e) => updateSeller({ accountNumber: e.target.value })} placeholder="1234567890" className="font-mono h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">IFSC Code</Label>
              <Input value={seller.ifsc} onChange={(e) => updateSeller({ ifsc: e.target.value.toUpperCase() })} placeholder="SBIN0001234" className="font-mono h-9 text-sm" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">UPI ID (optional)</Label>
              <Input value={seller.upiId} onChange={(e) => updateSeller({ upiId: e.target.value })} placeholder="business@upi" className="h-9 text-sm" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-4 pb-3">
            <CardTitle className="text-sm">Default Invoice Notes</CardTitle>
            <CardDescription className="text-xs">Pre-filled in the notes field when creating new invoices</CardDescription>
          </CardHeader>
          <CardContent className="px-4">
            <Textarea value={seller.defaultNotes} onChange={(e) => updateSeller({ defaultNotes: e.target.value })} placeholder="E.g. Payment due within 30 days. Late payments attract 2% interest per month." rows={3} className="text-sm" />
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
