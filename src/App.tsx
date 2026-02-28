import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/stores/appStore";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import CreateInvoice from "./pages/CreateInvoice";
import InvoiceDetailPage from "./pages/InvoiceDetailPage";
import SettingsPage from "./pages/SettingsPage";
import CustomersPage from "./pages/CustomersPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isConfigured } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3 animate-fade-in">
          <div className="h-8 w-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If Firebase is not configured, skip auth entirely (offline mode)
  if (!isConfigured) return <>{children}</>;

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, userId, isConfigured } = useAuth();
  const { loadData, clearStoreData } = useAppStore();

  useEffect(() => {
    if (isConfigured && user && userId) {
      loadData(userId);
    } else if (!isConfigured && userId) {
      // Offline mode: load with local user id
      loadData(userId);
    } else if (isConfigured && !user) {
      clearStoreData();
    }
  }, [user, userId, isConfigured, loadData, clearStoreData]);

  return (
    <Routes>
      <Route path="/login" element={
        isConfigured && user ? <Navigate to="/" replace /> :
          !isConfigured ? <Navigate to="/" replace /> :
            <LoginPage />
      } />
      <Route path="/" element={<AuthGuard><Index /></AuthGuard>} />
      <Route path="/new" element={<AuthGuard><CreateInvoice /></AuthGuard>} />
      <Route path="/invoice/:id" element={<AuthGuard><InvoiceDetailPage /></AuthGuard>} />
      <Route path="/settings" element={<AuthGuard><SettingsPage /></AuthGuard>} />
      <Route path="/customers" element={<AuthGuard><CustomersPage /></AuthGuard>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
