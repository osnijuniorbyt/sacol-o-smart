import { ReactNode, useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
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
 import logoLight from '@/assets/logo-hortii-transparent.png';

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
    <div ref={mainRef} className="min-h-screen bg-background">
      {/* Mobile header - Industrial Dark */}
      <header className="lg:hidden flex items-center justify-between p-4 header-mobile pl-safe pr-safe border-b border-border bg-card">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="h-12 w-12 text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <Menu className="h-6 w-6" />
        </Button>
        
        {/* Logo centralizada */}
        <img src={logoLight} alt="Hortii" className="h-8 w-auto object-contain" />
        
        <SyncStatusIndicator />
      </header>

      {/* Swipe indicator - industrial */}
      <div 
        className={cn(
          "lg:hidden fixed left-0 top-1/2 -translate-y-1/2 z-30 transition-all duration-500",
          sidebarOpen ? "opacity-0 -translate-x-full" : "opacity-100"
        )}
      >
        <div className="relative flex items-center">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-transparent blur-lg w-8 h-20 rounded-r-full" />
          
          {/* Main indicator */}
          <div className="relative bg-card rounded-r-xl shadow-lg border-y border-r border-border overflow-hidden">
            <div className="px-1.5 py-4 flex flex-col items-center gap-1">
              <ChevronRight className="h-4 w-4 text-primary animate-[pulse_1.5s_ease-in-out_infinite]" />
              <ChevronRight className="h-4 w-4 text-primary/70 animate-[pulse_1.5s_ease-in-out_0.2s_infinite]" />
              <ChevronRight className="h-4 w-4 text-primary/40 animate-[pulse_1.5s_ease-in-out_0.4s_infinite]" />
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Industrial Dark */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-sidebar-background transform transition-transform duration-300 ease-out lg:translate-x-0 lg:left-3 lg:top-3 lg:bottom-3 lg:h-auto lg:rounded-xl lg:border lg:border-sidebar-border",
          "shadow-2xl",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full lg:rounded-xl overflow-hidden">
          {/* Logo container */}
          <div className="relative border-b border-sidebar-border">
            <div className="relative overflow-hidden h-[80px] lg:rounded-t-xl flex items-center justify-center bg-sidebar-accent">
              <img 
                src={logoLight}
                alt="Horti Campos"
                className="h-12 w-auto object-contain"
              />
              
              {/* Close button for mobile */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden absolute top-2 right-2 h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent flex-shrink-0 z-20 rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {allNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium flex-1">{item.label}</span>
                  {'shortcut' in item && item.shortcut && (
                    <span className="text-xs text-sidebar-foreground/50 hidden lg:inline">{item.shortcut}</span>
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
          <div className="p-3 border-t border-sidebar-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={signOut}
            >
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-[280px] min-h-screen bg-background">
        <div className="p-4 lg:p-6 pb-safe">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="text-muted-foreground text-sm font-medium">
                  {allNavItems.find(item => item.path === location.pathname)?.label || 'Página'}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          {children}
        </div>
      </main>
    </div>
  );
}
