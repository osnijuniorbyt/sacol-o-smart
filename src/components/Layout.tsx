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
import { BrandLogo } from '@/components/BrandLogo';
import logoFull from '@/assets/logo-hortii-cream.png';

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
    <div ref={mainRef} className="min-h-screen bg-gradient-to-br from-[hsl(42,35%,95%)] via-[hsl(40,30%,93%)] to-[hsl(38,40%,90%)]">
      {/* Mobile header - Premium com tema pôr do sol - Otimizado para Dynamic Island */}
      <header className="lg:hidden flex items-center justify-between p-4 header-mobile pl-safe pr-safe border-b-2 border-[hsl(38,80%,55%,0.4)] bg-gradient-to-r from-[hsl(150,50%,12%)] via-[hsl(150,45%,16%)] to-[hsl(150,50%,12%)] shadow-lg shadow-[hsl(30,60%,30%,0.3)]">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="h-12 w-12 text-primary/80 hover:text-primary hover:bg-white/10"
        >
          <Menu className="h-6 w-6" />
        </Button>
        
        {/* Logo centralizada */}
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
          {/* Glow effect - sunset */}
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(38,80%,55%,0.5)] to-transparent blur-lg w-8 h-20 rounded-r-full" />
          
          {/* Main indicator - sunset theme */}
          <div className="relative bg-gradient-to-b from-[hsl(150,45%,14%)] via-[hsl(150,40%,12%)] to-[hsl(150,45%,10%)] rounded-r-2xl shadow-lg border-y border-r border-[hsl(40,75%,55%,0.4)] overflow-hidden">
            <div className="px-1.5 py-4 flex flex-col items-center gap-1">
              {/* Animated chevrons - sunset colors */}
              <ChevronRight className="h-4 w-4 text-[hsl(45,85%,65%)] animate-[pulse_1.5s_ease-in-out_infinite]" />
              <ChevronRight className="h-4 w-4 text-[hsl(40,80%,55%,0.7)] animate-[pulse_1.5s_ease-in-out_0.2s_infinite]" />
              <ChevronRight className="h-4 w-4 text-[hsl(35,75%,50%,0.5)] animate-[pulse_1.5s_ease-in-out_0.4s_infinite]" />
            </div>
            
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-[hsl(45,60%,80%,0.15)] via-transparent to-transparent pointer-events-none" />
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

      {/* Sidebar - Premium dark green com tema pôr do sol */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-gradient-to-b from-[hsl(150,50%,14%)] via-[hsl(150,45%,12%)] to-[hsl(150,50%,10%)] transform transition-transform duration-300 ease-out lg:translate-x-0 lg:left-3 lg:top-3 lg:bottom-3 lg:h-auto lg:rounded-2xl lg:border lg:border-[hsl(40,60%,55%,0.3)]",
          "shadow-2xl lg:shadow-[0_8px_32px_-4px_hsl(38,70%,45%,0.35),0_4px_16px_-2px_hsl(30,60%,35%,0.25)]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full lg:rounded-2xl overflow-hidden">
          {/* Logo preenchendo o container - tema pôr do sol sutil */}
          <div className="relative border-b border-[hsl(40,50%,55%,0.2)]">
            {/* Container da logo - altura fixa com bordas arredondadas no desktop */}
            <div className="relative overflow-hidden h-[140px] lg:rounded-t-2xl">
              {/* Borda metálica sutil */}
              <div className="absolute inset-0 lg:rounded-t-2xl ring-1 ring-inset ring-[hsl(40,60%,60%,0.25)]" />
              
              {/* Shimmer sutil na borda inferior */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-[2px] animate-shimmer z-10 opacity-50"
                style={{
                  background: 'linear-gradient(90deg, transparent, hsl(40,70%,60%), hsl(45,30%,85%), hsl(40,70%,60%), transparent)',
                  backgroundSize: '200% 100%',
                }}
              />
              
              {/* Logo preenchendo totalmente o container */}
              <img 
                src={logoFull}
                alt="Horti Campos"
                className="w-full h-full object-cover object-center lg:rounded-t-2xl"
              />
              
              {/* Close button for mobile - posicionado sobre a logo */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden absolute top-2 right-2 h-8 w-8 text-[hsl(30,40%,40%)] hover:text-[hsl(30,50%,30%)] hover:bg-[hsl(40,30%,85%,0.7)] flex-shrink-0 z-20 rounded-full"
              >
                <X className="h-4 w-4" />
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
                      ? "bg-gradient-to-r from-primary via-[hsl(36,90%,45%)] to-primary text-white shadow-lg shadow-[hsl(36,90%,30%,0.5)] border-t border-[hsl(36,80%,70%,0.3)]"
                      : "hover:bg-white/5 text-[hsl(40,30%,80%)] hover:text-primary active:bg-white/10"
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
          <div className="p-3 border-t border-[hsl(40,70%,55%,0.25)]">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-[hsl(42,35%,75%)] hover:text-[hsl(45,85%,65%)] hover:bg-white/5"
              onClick={signOut}
            >
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content - Premium sunset cream background */}
      <main className="lg:ml-[280px] min-h-screen bg-gradient-to-br from-[hsl(42,35%,95%)] via-[hsl(40,30%,93%)] to-[hsl(38,40%,90%)]">
        <div className="p-4 lg:p-6 pb-safe">
          {/* Breadcrumb - página atual */}
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="text-foreground/70 text-sm font-medium">
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
