 import { ReactNode } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { ChevronLeft, Wifi } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';
 
 interface MobileLayoutProps {
   children: ReactNode;
   title: string;
   showBack?: boolean;
   rightAction?: ReactNode;
 }
 
 export function MobileLayout({ 
   children, 
   title, 
   showBack = true,
   rightAction 
 }: MobileLayoutProps) {
   const navigate = useNavigate();
 
   return (
     <div className="flex flex-col min-h-[100dvh] bg-slate-100">
       {/* Header fixo - estilo Titan */}
       <header className="flex items-center justify-between h-14 px-3 bg-slate-800 text-white pt-safe">
         {/* Voltar */}
         {showBack ? (
           <Button
             variant="ghost"
             size="icon"
             onClick={() => navigate(-1)}
             className="h-12 w-12 text-white hover:bg-white/10"
           >
             <ChevronLeft className="h-7 w-7" />
           </Button>
         ) : (
           <div className="w-12" />
         )}
 
         {/* Título */}
         <h1 className="text-lg font-semibold">{title}</h1>
 
         {/* Ação direita */}
         {rightAction || (
           <div className="w-12 flex items-center justify-center">
             <SyncStatusIndicator />
           </div>
         )}
       </header>
 
       {/* Conteúdo */}
       <main className="flex-1 p-4 pb-safe overflow-y-auto">
         {children}
       </main>
     </div>
   );
 }