 import { useNavigate } from 'react-router-dom';
 import { ShoppingCart, Package, DollarSign, TrendingDown } from 'lucide-react';
 import logoHortii from '@/assets/logo-hortii-transparent.png';
 
 export function HomeLauncher() {
   const navigate = useNavigate();
 
   return (
     <div className="flex flex-col min-h-[100dvh] bg-background">
       {/* Header simples com logo centralizada */}
       <header className="flex items-center justify-center py-6 border-b border-border/50">
         <img 
           src={logoHortii} 
           alt="Hortii" 
           className="h-14 w-auto object-contain"
         />
       </header>
 
       {/* Grid 2x2 com botões gigantes */}
       <div className="flex-1 p-4 flex items-center">
         <div className="grid grid-cols-2 gap-4 w-full">
           {/* COMPRAS - Verde escuro */}
           <button
             onClick={() => navigate('/compras')}
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
     </div>
   );
 }