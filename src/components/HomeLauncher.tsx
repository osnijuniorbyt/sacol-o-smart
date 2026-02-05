 import { useNavigate } from 'react-router-dom';
 import { ShoppingCart, Package, Warehouse, AlertTriangle } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 interface LauncherItem {
   title: string;
   description: string;
   icon: React.ElementType;
   route: string;
   colorClass: string;
   bgClass: string;
 }
 
 const launcherItems: LauncherItem[] = [
   {
     title: 'PDV',
     description: 'Ponto de Venda',
     icon: ShoppingCart,
     route: '/pdv',
     colorClass: 'text-green-600',
     bgClass: 'bg-green-500/10 hover:bg-green-500/20 active:bg-green-500/30',
   },
   {
     title: 'Compras',
     description: 'Pedidos de Compra',
     icon: Package,
     route: '/compras',
     colorClass: 'text-blue-600',
     bgClass: 'bg-blue-500/10 hover:bg-blue-500/20 active:bg-blue-500/30',
   },
   {
     title: 'Estoque',
     description: 'Controle de Lotes',
     icon: Warehouse,
     route: '/estoque',
     colorClass: 'text-amber-600',
     bgClass: 'bg-amber-500/10 hover:bg-amber-500/20 active:bg-amber-500/30',
   },
   {
     title: 'Quebras',
     description: 'Registrar Perdas',
     icon: AlertTriangle,
     route: '/quebras',
     colorClass: 'text-red-600',
     bgClass: 'bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30',
   },
 ];
 
 export function HomeLauncher() {
   const navigate = useNavigate();
 
   return (
     <div className="flex flex-col min-h-[calc(100dvh-4rem)] p-4">
       {/* Header */}
       <div className="text-center mb-6">
         <h1 className="text-2xl font-bold text-foreground">Sacola Mágica</h1>
         <p className="text-sm text-muted-foreground mt-1">O que você deseja fazer?</p>
       </div>
 
       {/* Grid 2x2 */}
       <div className="grid grid-cols-2 gap-4 flex-1 max-h-[60vh]">
         {launcherItems.map((item) => (
           <button
             key={item.route}
             onClick={() => navigate(item.route)}
             className={cn(
               'flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/50 transition-all duration-200',
               'min-h-[140px] p-4',
               'shadow-sm hover:shadow-md active:scale-[0.98]',
               item.bgClass
             )}
           >
             <div className={cn('p-4 rounded-full bg-background/80 shadow-sm', item.colorClass)}>
               <item.icon className="h-8 w-8" strokeWidth={2} />
             </div>
             <div className="text-center">
               <span className="text-lg font-semibold text-foreground block">{item.title}</span>
               <span className="text-xs text-muted-foreground">{item.description}</span>
             </div>
           </button>
         ))}
       </div>
 
       {/* Footer shortcut to Dashboard */}
       <button
         onClick={() => navigate('/dashboard')}
         className="mt-6 py-3 px-6 rounded-xl border border-border bg-card hover:bg-accent transition-colors text-sm text-muted-foreground"
       >
         📊 Ver Dashboard Completo
       </button>
     </div>
   );
 }