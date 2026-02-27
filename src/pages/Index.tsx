import { InvoiceList } from "@/components/InvoiceList";
import { useInvoices } from "@/hooks/useInvoices";

const Index = () => {
  const { invoices } = useInvoices();

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <InvoiceList invoices={invoices} />
    </div>
  );
};

export default Index;
