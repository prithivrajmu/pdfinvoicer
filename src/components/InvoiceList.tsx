import { useState } from "react";
import { Link } from "react-router-dom";
import { Invoice, InvoiceStatus, getInvoiceTotal, formatINR } from "@/types/invoice";
import { InvoiceStatusBadge } from "@/components/InvoiceStatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, Settings, Users } from "lucide-react";

const statusFilters: { label: string; value: InvoiceStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
];

interface InvoiceListProps {
  invoices: Invoice[];
}

export const InvoiceList = ({ invoices }: InvoiceListProps) => {
  const [filter, setFilter] = useState<InvoiceStatus | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = invoices.filter((inv) => {
    if (filter !== "all" && inv.status !== filter) return false;
    if (search && !inv.clientName.toLowerCase().includes(search.toLowerCase()) && !inv.invoiceNumber.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalOutstanding = invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((s, i) => s + getInvoiceTotal(i.items), 0);

  const totalPaid = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + getInvoiceTotal(i.items), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Invoices</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage and track your invoices</p>
        </div>
        <div className="flex gap-1.5">
          <Link to="/customers">
            <Button variant="outline" size="sm" className="h-8 text-xs hidden sm:flex">
              <Users className="h-3.5 w-3.5 mr-1" /> Customers
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 sm:hidden">
              <Users className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Link to="/settings">
            <Button variant="outline" size="icon" className="h-8 w-8">
              <Settings className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Link to="/new">
            <Button size="sm" className="h-8 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" /> New
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card className="p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">Invoices</p>
          <p className="text-lg sm:text-2xl font-bold mt-0.5">{invoices.length}</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">Outstanding</p>
          <p className="text-sm sm:text-2xl font-bold font-mono mt-0.5">{formatINR(totalOutstanding)}</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">Paid</p>
          <p className="text-sm sm:text-2xl font-bold font-mono mt-0.5 text-success">{formatINR(totalPaid)}</p>
        </Card>
      </div>

      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {statusFilters.map((f) => (
            <Button key={f.value} variant={filter === f.value ? "default" : "outline"} size="sm" onClick={() => setFilter(f.value)} className="text-xs h-7 shrink-0">
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            {invoices.length === 0 ? "No invoices yet. Create your first one!" : "No invoices match your filters."}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((invoice) => (
            <Link key={invoice.id} to={`/invoice/${invoice.id}`}>
              <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">{invoice.clientName}</p>
                        <InvoiceStatusBadge status={invoice.status} />
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{invoice.invoiceNumber} · {new Date(invoice.issueDate).toLocaleDateString("en-IN")}</p>
                    </div>
                  </div>
                  <p className="font-bold font-mono text-sm shrink-0">{formatINR(getInvoiceTotal(invoice.items))}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
