import { InvoiceForm } from "@/components/InvoiceForm";
import { useInvoices } from "@/hooks/useInvoices";

const CreateInvoice = () => {
  const { addInvoice, nextInvoiceNumber } = useInvoices();

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <InvoiceForm invoiceNumber={nextInvoiceNumber()} onSubmit={addInvoice} />
    </div>
  );
};

export default CreateInvoice;
