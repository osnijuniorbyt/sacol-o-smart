// Layout component with MD3 redesign - v2
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
  FileBarChart,
  X,
  Truck,
  Building2,
  Users,
  Box,
  MoreHorizontal,
} from 'lucide-react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';
import { BrandLogo } from '@/components/BrandLogo';
import logoFull from '@/assets/logo-hortii-cream.png';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/pdv', label: 'PDV', icon: ShoppingCart, shortcut: 'F2' },
  { path: '/compras', label: 'Compras', icon: Truck },
  { path: '/relatorios', label: 'Relatórios', icon: FileBarChart },
  { path: '/estoque', label: 'Estoque', icon: Package },
  { path: '/quebras', label: 'Quebras', icon: Trash2, shortcut: 'F3' },
  { path: '/produtos', label: 'Produtos', icon: Apple },
  { path: '/vasilhames', label: 'Vasilhames', icon: Box },
  { path: '/fornecedores', label: 'Fornecedores', icon: Building2 },
];

// Mobile bottom nav items
const mobileNavItems = [
  { path: '/', label: 'Home', icon: LayoutDashboard },
  { path: '/pdv', label: 'PDV', icon: ShoppingCart },
  { path: '/compras', label: 'Compras', icon: Truck },
  { path: '/estoque', label: 'Estoque', icon: Package },
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
      {/* Mobile header - Clean MD3 style */}
      <header className="md:hidden flex items-center justify-between px-4 header-mobile pl-safe pr-safe bg-[hsl(153,43%,15%)] shadow-md">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="h-11 w-11 text-white/80 hover:text-white hover:bg-white/10 rounded-xl"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        {/* Logo centralizada */}
        <BrandLogo size="sm" variant="icon-only" />
        
        <SyncStatusIndicator />
      </header>

      {/* Swipe indicator - simplified */}
      <div 
        className={cn(
          "md:hidden fixed left-0 top-1/2 -translate-y-1/2 z-30 transition-all duration-300",
          sidebarOpen ? "opacity-0 -translate-x-full" : "opacity-100"
        )}
      >
        <div className="bg-[hsl(153,43%,15%)] rounded-r-xl px-1 py-3 shadow-lg">
          <ChevronRight className="h-4 w-4 text-primary animate-pulse" />
        </div>
      </div>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - #1B4332 solid background */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-[hsl(153,43%,15%)] transform transition-transform duration-300 ease-out md:translate-x-0 md:left-3 md:top-3 md:bottom-3 md:h-auto md:rounded-2xl",
          "shadow-xl",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full md:rounded-2xl overflow-hidden">
          {/* Logo container */}
          <div className="relative border-b border-white/10">
            <div className="relative overflow-hidden h-[140px] md:rounded-t-2xl">
              {/* Logo */}
              <img 
                src={logoFull}
                alt="Horti Campos"
                className="w-full h-full object-cover object-center md:rounded-t-2xl"
              />
              
              {/* Close button for mobile */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="md:hidden absolute top-2 right-2 h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 rounded-xl z-20"
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
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-primary text-white shadow-md"
                      : "hover:bg-white/10 text-white/80 hover:text-white"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium flex-1">{item.label}</span>
                  {'shortcut' in item && item.shortcut && (
                    <span className="text-xs opacity-50 hidden md:inline">{item.shortcut}</span>
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
          <div className="p-3 border-t border-white/10">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-11 text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
              onClick={signOut}
            >
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="md:ml-[280px] min-h-screen pb-20 md:pb-0">
        <div className="p-4 md:p-6">
          {/* Breadcrumb - página atual */}
          <Breadcrumb className="mb-6">
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

      {/* Mobile Bottom Navigation - MD3 Style */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-lg fixed-bottom-safe">
        <div className="flex items-center justify-around px-2 py-2">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-4 rounded-2xl transition-all duration-200 min-w-[64px]",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5 mb-1", isActive && "text-primary")} />
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive && "text-primary"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
          {/* More button to open sidebar */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center justify-center py-2 px-4 rounded-2xl transition-all text-muted-foreground hover:text-foreground min-w-[64px]"
          >
            <MoreHorizontal className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Mais</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
