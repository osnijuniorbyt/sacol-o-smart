 import { useNavigate } from 'react-router-dom';
 import { Plus, ClipboardList, Truck, ChevronLeft } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import logoHortii from '@/assets/logo-hortii-cream.png';
 
 export default function MobileComprasMenu() {
   const navigate = useNavigate();
 
   const menuItems = [
     { 
       icon: Plus, 
       label: 'NOVO PEDIDO', 
       emoji: '➕',
       path: '/compras?tab=novo' 
     },
     { 
       icon: ClipboardList, 
       label: 'MEUS PEDIDOS', 
       emoji: '📋',
       path: '/compras?tab=enviados' 
     },
     { 
       icon: Truck, 
       label: 'RECEBIMENTO', 
       emoji: '🚚',
       path: '/compras?tab=recebidos' 
     },
   ];
 
   return (
     <div className="flex flex-col min-h-[100dvh] bg-slate-800">
       {/* Header com logo */}
       <header className="flex items-center justify-center py-8 pt-safe">
         <img 
           src={logoHortii} 
           alt="Smart" 
           className="h-12 w-auto object-contain"
         />
       </header>
 
       {/* Título */}
       <div className="text-center mb-8">
         <h1 className="text-2xl font-bold text-white">Compras</h1>
       </div>
 
       {/* Menu de botões pílula */}
       <div className="flex-1 px-6 space-y-4">
         {menuItems.map((item) => (
           <button
             key={item.path}
             onClick={() => navigate(item.path)}
             className="flex items-center justify-center gap-3 w-full py-5 rounded-full bg-slate-200 hover:bg-slate-300 active:scale-[0.98] transition-all text-slate-800"
           >
             <span className="text-xl">{item.emoji}</span>
             <span className="text-base font-bold">{item.label}</span>
           </button>
         ))}
       </div>
 
       {/* Footer com botão Voltar */}
       <footer className="p-4 pb-safe">
         <Button
           variant="secondary"
           onClick={() => navigate(-1)}
           className="w-full h-14 rounded-full bg-slate-300 hover:bg-slate-400 text-slate-800 font-semibold text-base"
         >
           <ChevronLeft className="h-5 w-5 mr-2" />
           Voltar
         </Button>
       </footer>
     </div>
   );
 }