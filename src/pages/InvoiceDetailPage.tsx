import { InvoiceDetail } from "@/components/InvoiceDetail";
import { useInvoices } from "@/hooks/useInvoices";

const InvoiceDetailPage = () => {
  const { getInvoice, updateStatus, deleteInvoice } = useInvoices();

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <InvoiceDetail getInvoice={getInvoice} updateStatus={updateStatus} deleteInvoice={deleteInvoice} />
    </div>
  );
};

export default InvoiceDetailPage;
