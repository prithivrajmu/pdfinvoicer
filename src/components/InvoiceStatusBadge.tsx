import { InvoiceStatus } from "@/types/invoice";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<InvoiceStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  sent: { label: "Sent", className: "bg-primary/10 text-primary" },
  paid: { label: "Paid", className: "bg-success/10 text-success" },
  overdue: { label: "Overdue", className: "bg-destructive/10 text-destructive" },
  cancelled: { label: "Cancelled", className: "bg-warning/10 text-warning" },
};

export const InvoiceStatusBadge = ({ status }: { status: InvoiceStatus }) => {
  const config = statusConfig[status] || statusConfig.draft;
  return (
    <Badge variant="secondary" className={cn("font-medium border-0 text-xs", config.className)}>
      {config.label}
    </Badge>
  );
};
