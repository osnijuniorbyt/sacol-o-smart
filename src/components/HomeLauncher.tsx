 import { useState } from 'react';
 import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Package, DollarSign, TrendingDown, X, Menu, BarChart3, LogOut } from 'lucide-react';
 import logoHortii from '@/assets/logo-hortii-cream.png';
 import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
 
 export function HomeLauncher() {
   const navigate = useNavigate();
  const { signOut } = useAuth();
   const [showSidebar, setShowSidebar] = useState(false);

   const menuItems = [
     { icon: BarChart3, label: 'Gestão', path: '/' },
     { icon: Package, label: 'Estoques', path: '/estoque' },
    { icon: ShoppingCart, label: 'Compras', path: '/mobile/compras' },
     { icon: DollarSign, label: 'PDV', path: '/pdv' },
     { icon: TrendingDown, label: 'Quebras', path: '/quebras' },
   ];
 
   return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      {/* Header corporativo azul escuro */}
      <header className="flex items-center justify-between px-4 py-3 bg-primary pt-safe">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSidebar(true)}
          className="h-12 w-12 text-white hover:bg-white/10"
        >
          <Menu className="h-6 w-6" />
        </Button>
        
        <img src={logoHortii} alt="Smart" className="h-10 w-auto object-contain" />
        
        <div className="w-12" /> {/* Spacer para centralizar logo */}
       </header>
 
      {/* Grid 2x2 com ícones grandes corporativos */}
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="grid grid-cols-2 gap-6 w-full max-w-md">
          {/* Gestão */}
          <button
            onClick={() => navigate('/')}
            className="flex flex-col items-center justify-center gap-3 min-h-[140px] rounded-2xl bg-card hover:bg-secondary active:scale-[0.98] transition-all shadow-md border border-border"
          >
            <BarChart3 className="h-14 w-14 text-primary" strokeWidth={1.5} />
            <span className="text-base font-semibold text-primary">Gestão</span>
          </button>

          {/* Estoques */}
           <button
            onClick={() => navigate('/estoque')}
            className="flex flex-col items-center justify-center gap-3 min-h-[140px] rounded-2xl bg-card hover:bg-secondary active:scale-[0.98] transition-all shadow-md border border-border"
           >
            <Package className="h-14 w-14 text-primary" strokeWidth={1.5} />
            <span className="text-base font-semibold text-primary">Estoques</span>
           </button>
 
          {/* Compras */}
           <button
            onClick={() => navigate('/mobile/compras')}
            className="flex flex-col items-center justify-center gap-3 min-h-[140px] rounded-2xl bg-card hover:bg-secondary active:scale-[0.98] transition-all shadow-md border border-border"
           >
            <ShoppingCart className="h-14 w-14 text-primary" strokeWidth={1.5} />
            <span className="text-base font-semibold text-primary">Compras</span>
           </button>
 
          {/* PDV */}
           <button
             onClick={() => navigate('/pdv')}
            className="flex flex-col items-center justify-center gap-3 min-h-[140px] rounded-2xl bg-card hover:bg-secondary active:scale-[0.98] transition-all shadow-md border border-border"
           >
            <DollarSign className="h-14 w-14 text-primary" strokeWidth={1.5} />
            <span className="text-base font-semibold text-primary">PDV</span>
           </button>
         </div>
       </div>
 
      {/* Sidebar corporativa */}
      {showSidebar && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowSidebar(false)}
          />
          <aside className="fixed top-0 left-0 z-50 h-full w-72 bg-primary shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex flex-col h-full">
              {/* Header sidebar */}
              <div className="flex items-center justify-between p-4 border-b border-white/20 pt-safe">
                <img src={logoHortii} alt="Smart" className="h-10 w-auto object-contain" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSidebar(false)}
                  className="h-10 w-10 text-white hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Menu items */}
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {menuItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      setShowSidebar(false);
                      navigate(item.path);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3.5 rounded-lg text-white hover:bg-white/10 transition-colors"
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>

              {/* Logout */}
              <div className="p-3 border-t border-white/20 pb-safe">
                <button
                  onClick={signOut}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Sair</span>
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
     </div>
   );
 }