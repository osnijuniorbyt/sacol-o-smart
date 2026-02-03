import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Trash2,
  Apple,
  LogOut,
  Menu,
  X,
  Truck,
  Building2,
} from 'lucide-react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';
import logoHorticampos from '@/assets/logo-horticampos.jpeg';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/pdv', label: 'PDV', icon: ShoppingCart, shortcut: 'F2' },
  { path: '/compras', label: 'Compras', icon: Truck },
  { path: '/estoque', label: 'Estoque', icon: Package },
  { path: '/quebras', label: 'Quebras', icon: Trash2, shortcut: 'F3' },
  { path: '/produtos', label: 'Produtos', icon: Apple },
  { path: '/fornecedores', label: 'Fornecedores', icon: Building2 },
];

export default function Layout({ children }: LayoutProps) {
  const { signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Global keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-emerald-50/30">
      {/* Mobile header */}
      <header className="lg:hidden flex items-center justify-between p-4 border-b bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-400 rounded-xl blur opacity-40"></div>
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-b from-amber-100 to-amber-50 shadow-md flex items-center justify-center p-1.5 ring-2 ring-amber-400/60 border-t border-amber-200">
              <img src={logoHorticampos} alt="Horti Campos" className="w-full h-full object-contain" />
            </div>
          </div>
          <span className="font-bold text-amber-100 drop-shadow">Horti Campos</span>
          <SyncStatusIndicator />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="h-14 w-14 text-amber-100 hover:text-white hover:bg-emerald-700/50"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </header>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-gradient-to-b from-emerald-900 via-emerald-850 to-emerald-950 border-r border-emerald-700/30 transform transition-transform duration-200 ease-in-out lg:translate-x-0 shadow-2xl",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo with 3D Metallic Effect */}
          <div className="p-6 border-b border-emerald-700/30 bg-gradient-to-br from-emerald-800/50 to-emerald-900/50">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-2xl blur-md opacity-50 scale-110"></div>
                <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-b from-amber-100 via-white to-amber-50 shadow-xl flex items-center justify-center p-2 ring-4 ring-amber-400/60 border-t-2 border-amber-200">
                  <div className="w-full h-full rounded-xl overflow-hidden">
                    <img 
                      src={logoHorticampos} 
                      alt="Horti Campos" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>
              <div className="text-center">
                <h1 className="font-bold text-lg bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 bg-clip-text text-transparent">Horti Campos</h1>
                <p className="text-xs text-emerald-300/80">Hortifruti & Naturais</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-4 rounded-xl transition-all h-14",
                    isActive
                      ? "bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-white shadow-lg shadow-amber-900/50 border-t border-amber-300/30"
                      : "hover:bg-emerald-800/50 text-emerald-200 hover:text-amber-200"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium flex-1">{item.label}</span>
                  {item.shortcut && (
                    <span className="text-xs opacity-60 hidden lg:inline">{item.shortcut}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sync Status */}
          <div className="px-4 pb-2">
            <SyncStatusIndicator showDetails />
          </div>

          {/* Logout button */}
          <div className="p-4 border-t border-emerald-700/30">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-14 text-emerald-300 hover:text-amber-200 hover:bg-emerald-800/50"
              onClick={signOut}
            >
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen bg-gradient-to-br from-amber-50/50 via-white to-emerald-50/30">
        <div className="p-4 lg:p-6 pb-safe">
          {children}
        </div>
      </main>
    </div>
  );
}
