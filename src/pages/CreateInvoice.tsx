import { InvoiceForm } from "@/components/InvoiceForm";
import { Invoice, SellerDetails } from "@/types/invoice";
import { Customer } from "@/types/customer";

interface CreateInvoiceProps {
  addInvoice: (invoice: Invoice) => void;
  nextInvoiceNumber: () => string;
  seller: SellerDetails;
  customers: Customer[];
  addCustomer: (c: Omit<Customer, "id">) => Customer;
}

const CreateInvoice = ({ addInvoice, nextInvoiceNumber, seller, customers, addCustomer }: CreateInvoiceProps) => {
  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <InvoiceForm invoiceNumber={nextInvoiceNumber()} seller={seller} customers={customers} addCustomer={addCustomer} onSubmit={addInvoice} />
    </div>
  );
};

export default CreateInvoice;
