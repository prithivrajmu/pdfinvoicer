import { Invoice } from "@/types/invoice";
import { InvoiceList } from "@/components/InvoiceList";

const Index = ({ invoices }: { invoices: Invoice[] }) => {
  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <InvoiceList invoices={invoices} />
    </div>
  );
};

export default Index;
