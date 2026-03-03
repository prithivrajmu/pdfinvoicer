import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/stores/appStore";
import { getInvoiceTotal, formatINR } from "@/types/invoice";
import { InvoiceStatusBadge } from "@/components/InvoiceStatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Plus, Search, FileText, Settings, Users, LogOut, TrendingUp,
  AlertCircle, CheckCircle2, Clock, BarChart3, HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useTutorial } from "@/contexts/TutorialContext";
import type { InvoiceStatus } from "@/types/invoice";

const statusFilters: { label: string; value: InvoiceStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
  { label: "Cancelled", value: "cancelled" },
];

const Index = () => {
  const { user, logout, userId, isConfigured } = useAuth();
  const { invoices, dataLoaded, checkOverdueInvoices } = useAppStore();
  const [filter, setFilter] = useState<InvoiceStatus | "all">("all");
  const [search, setSearch] = useState("");
  const { start: startTutorial, isActive: tutorialActive, hasCompleted: tutorialCompleted } = useTutorial();

  // Auto-start tutorial only on the user's very first login
  useEffect(() => {
    if (dataLoaded && userId && !tutorialCompleted()) {
      const t = setTimeout(() => startTutorial(), 500);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoaded, userId]);

  // Auto-detect overdue invoices on load
  useEffect(() => {
    if (dataLoaded && userId) {
      checkOverdueInvoices(userId).then((count) => {
        if (count > 0) {
          toast.warning(`${count} invoice${count > 1 ? "s" : ""} marked as overdue`);
        }
      });
    }
  }, [dataLoaded, userId, checkOverdueInvoices]);

  const filtered = invoices.filter((inv) => {
    if (filter !== "all" && inv.status !== filter) return false;
    if (
      search &&
      !inv.clientName.toLowerCase().includes(search.toLowerCase()) &&
      !inv.invoiceNumber.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const totalOutstanding = invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((s, i) => s + getInvoiceTotal(i.items), 0);

  const totalPaid = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + getInvoiceTotal(i.items), 0);

  const overdueCount = invoices.filter((i) => i.status === "overdue").length;

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      toast.error("Failed to sign out");
    }
  };

  if (!dataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Loading your data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Invoices</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {user?.displayName || user?.email || "Welcome"}
            </p>
          </div>
          <div className="flex gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => startTutorial()}
              title="Tutorial"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </Button>
            <Link to="/customers" id="nav-customers">
              <Button variant="outline" size="sm" className="h-8 text-xs hidden sm:flex">
                <Users className="h-3.5 w-3.5 mr-1" /> Customers
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 sm:hidden">
                <Users className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Link to="/settings" id="nav-settings">
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </Link>
            {isConfigured && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={handleLogout}
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            )}
            <Link to="/new" id="nav-new-invoice">
              <Button size="sm" className="h-8 text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" /> New
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div id="stats-section" className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <Card className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Total
              </p>
            </div>
            <p className="text-lg sm:text-2xl font-bold">{invoices.length}</p>
          </Card>
          <Card className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Outstanding
              </p>
            </div>
            <p className="text-sm sm:text-xl font-bold font-mono">
              {formatINR(totalOutstanding)}
            </p>
          </Card>
          <Card className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Paid
              </p>
            </div>
            <p className="text-sm sm:text-xl font-bold font-mono text-success">
              {formatINR(totalPaid)}
            </p>
          </Card>
          <Card className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-3.5 w-3.5 text-destructive" />
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Overdue
              </p>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-destructive">{overdueCount}</p>
          </Card>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="invoice-search"
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {statusFilters.map((f) => (
              <Button
                key={f.value}
                variant={filter === f.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f.value)}
                className="text-xs h-7 shrink-0"
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Invoice List */}
        {filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              {invoices.length === 0
                ? "No invoices yet. Create your first one!"
                : "No invoices match your filters."}
            </p>
            {invoices.length === 0 && (
              <Link to="/new">
                <Button size="sm" className="mt-3 text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Create Invoice
                </Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((invoice) => (
              <Link key={invoice.id} to={`/invoice/${invoice.id}`}>
                <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer group mb-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm truncate">
                            {invoice.clientName}
                          </p>
                          <InvoiceStatusBadge status={invoice.status} />
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                          {invoice.invoiceNumber} ·{" "}
                          {new Date(invoice.issueDate).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold font-mono text-sm shrink-0">
                      {formatINR(getInvoiceTotal(invoice.items))}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
