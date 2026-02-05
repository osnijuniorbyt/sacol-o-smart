 import { useState } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { ShoppingCart, Package, DollarSign, TrendingDown, ClipboardList, Plus, X } from 'lucide-react';
 import logoHortii from '@/assets/logo-hortii-cream.png';
 
 export function HomeLauncher() {
   const navigate = useNavigate();
   const [showComprasModal, setShowComprasModal] = useState(false);
 
   return (
     <div className="flex flex-col min-h-[100dvh] bg-gradient-to-br from-[hsl(42,35%,95%)] via-[hsl(40,30%,93%)] to-[hsl(38,40%,90%)]">
       {/* Header simples - apenas logo centralizada */}
       <header className="flex items-center justify-center py-4 bg-gradient-to-r from-[hsl(150,50%,12%)] via-[hsl(150,45%,16%)] to-[hsl(150,50%,12%)] border-b-2 border-[hsl(38,80%,55%,0.4)] shadow-lg pt-safe">
         <img 
           src={logoHortii} 
           alt="Hortii" 
           className="h-12 w-auto object-contain"
         />
       </header>
 
       {/* Grid 2x2 com botões gigantes */}
       <div className="flex-1 p-4 flex items-center">
         <div className="grid grid-cols-2 gap-4 w-full">
           {/* COMPRAS - Verde escuro */}
           <button
             onClick={() => setShowComprasModal(true)}
             className="flex flex-col items-center justify-center gap-3 min-h-[150px] rounded-2xl bg-[hsl(150,100%,20%)] hover:bg-[hsl(150,100%,25%)] active:scale-[0.98] transition-all shadow-lg"
           >
             <ShoppingCart className="h-12 w-12 text-white" strokeWidth={2.5} />
             <span className="text-xl font-bold text-white">COMPRAS</span>
           </button>
 
           {/* ESTOQUE - Azul */}
           <button
             onClick={() => navigate('/estoque')}
             className="flex flex-col items-center justify-center gap-3 min-h-[150px] rounded-2xl bg-[hsl(210,80%,45%)] hover:bg-[hsl(210,80%,50%)] active:scale-[0.98] transition-all shadow-lg"
           >
             <Package className="h-12 w-12 text-white" strokeWidth={2.5} />
             <span className="text-xl font-bold text-white">ESTOQUE</span>
           </button>
 
           {/* PDV - Laranja */}
           <button
             onClick={() => navigate('/pdv')}
             className="flex flex-col items-center justify-center gap-3 min-h-[150px] rounded-2xl bg-[hsl(36,90%,50%)] hover:bg-[hsl(36,90%,55%)] active:scale-[0.98] transition-all shadow-lg"
           >
             <DollarSign className="h-12 w-12 text-white" strokeWidth={2.5} />
             <span className="text-xl font-bold text-white">PDV</span>
           </button>
 
           {/* QUEBRAS - Vermelho */}
           <button
             onClick={() => navigate('/quebras')}
             className="flex flex-col items-center justify-center gap-3 min-h-[150px] rounded-2xl bg-[hsl(0,70%,50%)] hover:bg-[hsl(0,70%,55%)] active:scale-[0.98] transition-all shadow-lg"
           >
             <TrendingDown className="h-12 w-12 text-white" strokeWidth={2.5} />
             <span className="text-xl font-bold text-white">QUEBRAS</span>
           </button>
         </div>
       </div>
 
       {/* Modal de Compras */}
       {showComprasModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-card rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             {/* Header do modal */}
             <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-[hsl(150,50%,12%)] to-[hsl(150,45%,18%)]">
               <h2 className="text-lg font-bold text-white flex items-center gap-2">
                 <ShoppingCart className="h-5 w-5" />
                 Compras
               </h2>
               <button 
                 onClick={() => setShowComprasModal(false)}
                 className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
               >
                 <X className="h-5 w-5" />
               </button>
             </div>
 
             {/* Botões empilhados */}
             <div className="p-4 space-y-4">
               {/* Meus Pedidos - cinza/branco */}
               <button
                 onClick={() => {
                   setShowComprasModal(false);
                   navigate('/compras?tab=enviados');
                 }}
                 className="flex items-center justify-center gap-3 w-full min-h-[80px] rounded-2xl bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 active:scale-[0.98] transition-all shadow-md border border-slate-300"
               >
                 <ClipboardList className="h-8 w-8 text-slate-700" strokeWidth={2} />
                 <span className="text-lg font-bold text-slate-700">Meus Pedidos</span>
               </button>
 
               {/* Novo Pedido - verde */}
               <button
                 onClick={() => {
                   setShowComprasModal(false);
                   navigate('/compras?tab=novo');
                 }}
                 className="flex items-center justify-center gap-3 w-full min-h-[80px] rounded-2xl bg-gradient-to-r from-[hsl(150,100%,20%)] to-[hsl(150,80%,25%)] hover:from-[hsl(150,100%,25%)] hover:to-[hsl(150,80%,30%)] active:scale-[0.98] transition-all shadow-md"
               >
                 <Plus className="h-8 w-8 text-white" strokeWidth={2.5} />
                 <span className="text-lg font-bold text-white">Novo Pedido</span>
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }