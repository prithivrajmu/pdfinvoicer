import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useInvoices } from "@/hooks/useInvoices";
import { useSellerDetails } from "@/hooks/useSellerDetails";
import Index from "./pages/Index";
import CreateInvoice from "./pages/CreateInvoice";
import InvoiceDetailPage from "./pages/InvoiceDetailPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { invoices, addInvoice, updateStatus, deleteInvoice, getInvoice, nextInvoiceNumber } = useInvoices();
  const { seller, updateSeller } = useSellerDetails();

  return (
    <Routes>
      <Route path="/" element={<Index invoices={invoices} />} />
      <Route path="/new" element={<CreateInvoice addInvoice={addInvoice} nextInvoiceNumber={nextInvoiceNumber} seller={seller} />} />
      <Route path="/invoice/:id" element={<InvoiceDetailPage getInvoice={getInvoice} updateStatus={updateStatus} deleteInvoice={deleteInvoice} seller={seller} />} />
      <Route path="/settings" element={<SettingsPage seller={seller} updateSeller={updateSeller} />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
