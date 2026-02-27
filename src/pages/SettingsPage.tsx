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
    <div className="min-h-screen bg-background px-4 py-8">
      <form onSubmit={handleSave} className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <Button type="button" variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Business Settings</h1>
            <p className="text-sm text-muted-foreground">Your details will appear on all invoices</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Business Information</CardTitle>
            <CardDescription>This information appears at the top of your invoices</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Business Name</Label>
              <Input required value={seller.businessName} onChange={(e) => updateSeller({ businessName: e.target.value })} placeholder="Ishvarya Hospitality Solutions" />
            </div>
            <div className="space-y-2">
              <Label>Your Name</Label>
              <Input required value={seller.name} onChange={(e) => updateSeller({ name: e.target.value })} placeholder="Vel Vadivu" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={seller.phone} onChange={(e) => updateSeller({ phone: e.target.value })} placeholder="9487519401" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={seller.email} onChange={(e) => updateSeller({ email: e.target.value })} placeholder="you@business.com" />
            </div>
            <div className="space-y-2">
              <Label>GSTIN</Label>
              <Input value={seller.gstin} onChange={(e) => updateSeller({ gstin: e.target.value.toUpperCase() })} placeholder="33AQBPM0647A1ZJ" maxLength={15} className="font-mono" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Address</Label>
              <Textarea value={seller.address} onChange={(e) => updateSeller({ address: e.target.value })} placeholder="917, Selvapuram Alagapuram Pudur, Near ATC Nagar" rows={2} />
            </div>
            <div className="space-y-2">
              <Label>City, State</Label>
              <Input value={seller.cityState} onChange={(e) => updateSeller({ cityState: e.target.value })} placeholder="Salem, Tamil Nadu" />
            </div>
            <div className="space-y-2">
              <Label>Pincode</Label>
              <Input value={seller.pincode} onChange={(e) => updateSeller({ pincode: e.target.value })} placeholder="636016" maxLength={6} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pb-8">
          <Button type="button" variant="outline" onClick={() => navigate("/")}>Cancel</Button>
          <Button type="submit"><Save className="h-4 w-4 mr-2" /> Save Details</Button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
