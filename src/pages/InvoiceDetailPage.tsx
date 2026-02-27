import { InvoiceDetail } from "@/components/InvoiceDetail";
import { Invoice, InvoiceStatus, SellerDetails } from "@/types/invoice";

interface Props {
  getInvoice: (id: string) => Invoice | undefined;
  updateStatus: (id: string, status: InvoiceStatus) => void;
  deleteInvoice: (id: string) => void;
  seller: SellerDetails;
}

const InvoiceDetailPage = ({ getInvoice, updateStatus, deleteInvoice, seller }: Props) => {
  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <InvoiceDetail getInvoice={getInvoice} updateStatus={updateStatus} deleteInvoice={deleteInvoice} seller={seller} />
    </div>
  );
};

export default InvoiceDetailPage;
