 import { useState } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { ShoppingCart, Package, DollarSign, TrendingDown, ClipboardList, Plus, X } from 'lucide-react';
 import logoHortii from '@/assets/logo-hortii-transparent.png';
 
 export function HomeLauncher() {
   const navigate = useNavigate();
   const [showComprasModal, setShowComprasModal] = useState(false);
 
   return (
     <div className="flex flex-col min-h-[100dvh] bg-background">
       {/* Header industrial escuro */}
       <header className="flex items-center justify-center py-4 bg-card border-b border-border pt-safe">
         <img 
           src={logoHortii} 
           alt="Hortii" 
           className="h-10 w-auto object-contain"
         />
       </header>
 
       {/* Grid 2x2 com botões gigantes */}
       <div className="flex-1 p-3 flex items-center">
         <div className="grid grid-cols-2 gap-3 w-full">
           {/* COMPRAS - Verde */}
           <button
             onClick={() => setShowComprasModal(true)}
             className="flex flex-col items-center justify-center gap-2 min-h-[140px] rounded-xl bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all border border-primary/30"
           >
             <ShoppingCart className="h-10 w-10 text-primary-foreground" strokeWidth={2} />
             <span className="text-lg font-bold text-primary-foreground tracking-wide">COMPRAS</span>
           </button>
 
           {/* ESTOQUE - Azul industrial */}
           <button
             onClick={() => navigate('/estoque')}
             className="flex flex-col items-center justify-center gap-2 min-h-[140px] rounded-xl bg-[hsl(210,70%,40%)] hover:bg-[hsl(210,70%,45%)] active:scale-[0.98] transition-all border border-[hsl(210,70%,50%,0.3)]"
           >
             <Package className="h-10 w-10 text-white" strokeWidth={2} />
             <span className="text-lg font-bold text-white tracking-wide">ESTOQUE</span>
           </button>
 
           {/* PDV - Âmbar/Accent */}
           <button
             onClick={() => navigate('/pdv')}
             className="flex flex-col items-center justify-center gap-2 min-h-[140px] rounded-xl bg-accent hover:bg-accent/90 active:scale-[0.98] transition-all border border-accent/30"
           >
             <DollarSign className="h-10 w-10 text-accent-foreground" strokeWidth={2} />
             <span className="text-lg font-bold text-accent-foreground tracking-wide">PDV</span>
           </button>
 
           {/* QUEBRAS - Destructive */}
           <button
             onClick={() => navigate('/quebras')}
             className="flex flex-col items-center justify-center gap-2 min-h-[140px] rounded-xl bg-destructive hover:bg-destructive/90 active:scale-[0.98] transition-all border border-destructive/30"
           >
             <TrendingDown className="h-10 w-10 text-destructive-foreground" strokeWidth={2} />
             <span className="text-lg font-bold text-destructive-foreground tracking-wide">QUEBRAS</span>
           </button>
         </div>
       </div>
 
       {/* Modal de Compras - Industrial */}
       {showComprasModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
           <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-border">
             {/* Header do modal */}
             <div className="flex items-center justify-between p-4 border-b border-border bg-muted">
               <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                 <ShoppingCart className="h-5 w-5" />
                 Compras
               </h2>
               <button 
                 onClick={() => setShowComprasModal(false)}
                 className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
               >
                 <X className="h-5 w-5" />
               </button>
             </div>
 
             {/* Botões empilhados */}
             <div className="p-4 space-y-3">
               {/* Meus Pedidos */}
               <button
                 onClick={() => {
                   setShowComprasModal(false);
                   navigate('/compras?tab=enviados');
                 }}
                 className="flex items-center justify-center gap-3 w-full min-h-[70px] rounded-xl bg-secondary hover:bg-secondary/80 active:scale-[0.98] transition-all border border-border"
               >
                 <ClipboardList className="h-7 w-7 text-foreground" strokeWidth={2} />
                 <span className="text-base font-bold text-foreground">Meus Pedidos</span>
               </button>
 
               {/* Novo Pedido */}
               <button
                 onClick={() => {
                   setShowComprasModal(false);
                   navigate('/compras?tab=novo');
                 }}
                 className="flex items-center justify-center gap-3 w-full min-h-[70px] rounded-xl bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all border border-primary/30"
               >
                 <Plus className="h-7 w-7 text-primary-foreground" strokeWidth={2} />
                 <span className="text-base font-bold text-primary-foreground">Novo Pedido</span>
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }