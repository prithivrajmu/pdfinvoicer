import { useState } from "react";
import { Link } from "react-router-dom";
import { Invoice, InvoiceStatus, getInvoiceTotal, formatINR } from "@/types/invoice";
import { InvoiceStatusBadge } from "@/components/InvoiceStatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText } from "lucide-react";

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
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and track your invoices</p>
        </div>
        <div className="flex gap-2">
          <Link to="/settings">
            <Button variant="outline">Settings</Button>
          </Link>
          <Link to="/new">
            <Button><Plus className="h-4 w-4 mr-2" /> New Invoice</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Invoices</p>
          <p className="text-2xl font-bold mt-1">{invoices.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Outstanding</p>
          <p className="text-2xl font-bold font-mono mt-1">{formatINR(totalOutstanding)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Paid</p>
          <p className="text-2xl font-bold font-mono mt-1 text-success">{formatINR(totalPaid)}</p>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1">
          {statusFilters.map((f) => (
            <Button key={f.value} variant={filter === f.value ? "default" : "outline"} size="sm" onClick={() => setFilter(f.value)} className="text-xs">
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">
            {invoices.length === 0 ? "No invoices yet. Create your first one!" : "No invoices match your filters."}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((invoice) => (
            <Link key={invoice.id} to={`/invoice/${invoice.id}`}>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{invoice.clientName}</p>
                        <InvoiceStatusBadge status={invoice.status} />
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{invoice.invoiceNumber} · {new Date(invoice.issueDate).toLocaleDateString("en-IN")}</p>
                    </div>
                  </div>
                  <p className="font-bold font-mono">{formatINR(getInvoiceTotal(invoice.items))}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
