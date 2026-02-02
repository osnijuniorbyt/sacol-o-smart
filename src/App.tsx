import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useDismissKeyboardOnEnter } from "@/hooks/useDismissKeyboardOnEnter";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import PDV from "@/pages/PDV";
import Estoque from "@/pages/Estoque";
import Quebras from "@/pages/Quebras";
import Produtos from "@/pages/Produtos";
import Compras from "@/pages/Compras";
import Fornecedores from "@/pages/Fornecedores";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

// Componente para aplicar hooks globais
function GlobalHooks({ children }: { children: React.ReactNode }) {
  useDismissKeyboardOnEnter();
  return <>{children}</>;
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  // TODO: Re-enable authentication after testing
  // const { user, loading } = useAuth();

  // if (loading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  //     </div>
  //   );
  // }

  // if (!user) {
  //   return <Navigate to="/login" replace />;
  // }

  // TEMPORÁRIO: Bypass de autenticação para testes
  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  // TODO: Re-enable authentication after testing
  // TEMPORÁRIO: Sempre redireciona /login para o Dashboard
  return <Navigate to="/" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/pdv"
        element={
          <PrivateRoute>
            <PDV />
          </PrivateRoute>
        }
      />
      <Route
        path="/estoque"
        element={
          <PrivateRoute>
            <Estoque />
          </PrivateRoute>
        }
      />
      <Route
        path="/quebras"
        element={
          <PrivateRoute>
            <Quebras />
          </PrivateRoute>
        }
      />
      <Route
        path="/produtos"
        element={
          <PrivateRoute>
            <Produtos />
          </PrivateRoute>
        }
      />
      <Route
        path="/compras"
        element={
          <PrivateRoute>
            <Compras />
          </PrivateRoute>
        }
      />
      <Route
        path="/fornecedores"
        element={
          <PrivateRoute>
            <Fornecedores />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <GlobalHooks>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </GlobalHooks>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
