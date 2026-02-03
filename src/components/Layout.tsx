import { ReactNode, useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
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
  Users,
} from 'lucide-react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';
import { BrandLogo } from '@/components/BrandLogo';

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
  const { signOut, isAdmin } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Swipe gesture handling
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  
  // Global keyboard shortcuts
  useKeyboardShortcuts();

  // Build nav items including admin route if user is admin
  const allNavItems = isAdmin 
    ? [...navItems, { path: '/admin/usuarios', label: 'Usuários', icon: Users }]
    : navItems;

  // Handle swipe gesture to open/close sidebar
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchEndX.current = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      if (touchStartX.current === null || touchEndX.current === null) return;
      
      const swipeDistance = touchEndX.current - touchStartX.current;
      const minSwipeDistance = 80;
      
      // Swipe right from left edge to open sidebar
      if (touchStartX.current < 50 && swipeDistance > minSwipeDistance && !sidebarOpen) {
        setSidebarOpen(true);
      }
      
      // Swipe left to close sidebar
      if (swipeDistance < -minSwipeDistance && sidebarOpen) {
        setSidebarOpen(false);
      }
      
      touchStartX.current = null;
      touchEndX.current = null;
    };

    const mainElement = mainRef.current;
    if (mainElement) {
      mainElement.addEventListener('touchstart', handleTouchStart, { passive: true });
      mainElement.addEventListener('touchmove', handleTouchMove, { passive: true });
      mainElement.addEventListener('touchend', handleTouchEnd);
    }

    // Also add to document for edge swipes
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      if (mainElement) {
        mainElement.removeEventListener('touchstart', handleTouchStart);
        mainElement.removeEventListener('touchmove', handleTouchMove);
        mainElement.removeEventListener('touchend', handleTouchEnd);
      }
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [sidebarOpen]);

  return (
    <div ref={mainRef} className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-emerald-50/30">
      {/* Mobile header - Logo centralizada com safe area */}
      <header className="lg:hidden flex items-center justify-between p-4 pt-safe border-b bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 shadow-lg">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="h-12 w-12 text-amber-100 hover:text-white hover:bg-emerald-700/50"
        >
          <Menu className="h-6 w-6" />
        </Button>
        
        {/* Logo centralizada - maior destaque */}
        <BrandLogo size="sm" variant="icon-only" />
        
        <SyncStatusIndicator />
      </header>

      {/* Swipe indicator - visual hint melhorado */}
      <div 
        className={cn(
          "lg:hidden fixed left-0 top-1/2 -translate-y-1/2 z-30 transition-all duration-500",
          sidebarOpen ? "opacity-0 -translate-x-full" : "opacity-100"
        )}
      >
        <div className="relative flex items-center">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400/40 to-transparent blur-lg w-8 h-20 rounded-r-full" />
          
          {/* Main indicator */}
          <div className="relative bg-gradient-to-b from-emerald-800 via-emerald-700 to-emerald-800 rounded-r-2xl shadow-lg border-y border-r border-amber-500/30 overflow-hidden">
            <div className="px-1.5 py-4 flex flex-col items-center gap-1">
              {/* Animated chevrons */}
              <ChevronRight className="h-4 w-4 text-amber-400 animate-[pulse_1.5s_ease-in-out_infinite]" />
              <ChevronRight className="h-4 w-4 text-amber-300/70 animate-[pulse_1.5s_ease-in-out_0.2s_infinite]" />
              <ChevronRight className="h-4 w-4 text-amber-200/50 animate-[pulse_1.5s_ease-in-out_0.4s_infinite]" />
            </div>
            
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 bg-gradient-to-b from-emerald-900 via-emerald-850 to-emerald-950 border-r border-emerald-700/30 transform transition-transform duration-300 ease-out lg:translate-x-0 shadow-2xl",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo with more space */}
          <div className="p-6 border-b border-emerald-700/30 bg-gradient-to-br from-emerald-800/50 to-emerald-900/50">
            <div className="flex items-center justify-between">
              <BrandLogo size="md" />
              
              {/* Close button for mobile */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden h-10 w-10 text-amber-100 hover:text-white hover:bg-emerald-700/50"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
            {allNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all",
                    isActive
                      ? "bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-white shadow-lg shadow-amber-900/50 border-t border-amber-300/30"
                      : "hover:bg-emerald-800/50 text-emerald-200 hover:text-amber-200 active:bg-emerald-700/50"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium flex-1">{item.label}</span>
                  {'shortcut' in item && item.shortcut && (
                    <span className="text-xs opacity-60 hidden lg:inline">{item.shortcut}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sync Status */}
          <div className="px-3 pb-2">
            <SyncStatusIndicator showDetails />
          </div>

          {/* Logout button */}
          <div className="p-3 border-t border-emerald-700/30">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-emerald-300 hover:text-amber-200 hover:bg-emerald-800/50"
              onClick={signOut}
            >
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-72 min-h-screen bg-gradient-to-br from-amber-50/50 via-white to-emerald-50/30">
        <div className="p-4 lg:p-6 pb-safe">
          {children}
        </div>
      </main>
    </div>
  );
}
