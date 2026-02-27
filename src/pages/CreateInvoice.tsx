import { InvoiceForm } from "@/components/InvoiceForm";
import { Invoice, SellerDetails } from "@/types/invoice";

interface CreateInvoiceProps {
  addInvoice: (invoice: Invoice) => void;
  nextInvoiceNumber: () => string;
  seller: SellerDetails;
}

const CreateInvoice = ({ addInvoice, nextInvoiceNumber, seller }: CreateInvoiceProps) => {
  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <InvoiceForm invoiceNumber={nextInvoiceNumber()} seller={seller} onSubmit={addInvoice} />
    </div>
  );
};

export default CreateInvoice;
