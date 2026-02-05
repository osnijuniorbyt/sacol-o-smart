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
import Protocolo from "@/pages/Protocolo";
import PendingApproval from "@/pages/PendingApproval";
import AdminUsers from "@/pages/AdminUsers";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/NotFound";
import MobileComprasMenu from "@/pages/mobile/MobileComprasMenu";

const queryClient = new QueryClient();

// Componente para aplicar hooks globais
function GlobalHooks({ children }: { children: React.ReactNode }) {
  useDismissKeyboardOnEnter();
  return <>{children}</>;
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isApproved, isPasswordRecovery } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  // Se está em modo de recuperação de senha, redirecionar para reset-password
  if (isPasswordRecovery) {
    return <Navigate to="/reset-password" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se está carregando o status de aprovação, mostrar loading
  if (isApproved === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  // Se não está aprovado, redirecionar para página de aguardando
  if (!isApproved) {
    return <Navigate to="/pending-approval" replace />;
  }

  return <Layout>{children}</Layout>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isApproved, isAdmin, isPasswordRecovery } = useAuth();

  if (loading || isApproved === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  // Se está em modo de recuperação de senha, redirecionar para reset-password
  if (isPasswordRecovery) {
    return <Navigate to="/reset-password" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isApproved) {
    return <Navigate to="/pending-approval" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isApproved, isPasswordRecovery } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  // Se está em modo de recuperação de senha, redirecionar para reset-password
  if (isPasswordRecovery) {
    return <Navigate to="/reset-password" replace />;
  }

  if (user) {
    // Se está logado mas não aprovado, ir para pending
    if (isApproved === false) {
      return <Navigate to="/pending-approval" replace />;
    }
    // Se está logado e aprovado, ir para dashboard
    if (isApproved === true) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}

function PendingRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isApproved, isPasswordRecovery } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  // Se está em modo de recuperação de senha, redirecionar para reset-password
  if (isPasswordRecovery) {
    return <Navigate to="/reset-password" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se já está aprovado, redirecionar para dashboard
  if (isApproved === true) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Rota privada SEM layout (para rotas mobile)
function MobilePrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isApproved, isPasswordRecovery } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-800">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (isPasswordRecovery) {
    return <Navigate to="/reset-password" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isApproved === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-800">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isApproved) {
    return <Navigate to="/pending-approval" replace />;
  }

  // SEM Layout wrapper - renderiza diretamente
  return <>{children}</>;
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
        path="/pending-approval"
        element={
          <PendingRoute>
            <PendingApproval />
          </PendingRoute>
        }
      />
      <Route
        path="/reset-password"
        element={<ResetPassword />}
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
      <Route
        path="/protocolo/:orderId"
        element={
          <PrivateRoute>
            <Protocolo />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/usuarios"
        element={
          <AdminRoute>
            <AdminUsers />
          </AdminRoute>
        }
      />
      {/* Rotas Mobile - SEM layout desktop */}
      <Route
        path="/mobile/compras"
        element={
          <MobilePrivateRoute>
            <MobileComprasMenu />
          </MobilePrivateRoute>
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
