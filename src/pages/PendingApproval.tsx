import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandLogoLight } from '@/components/BrandLogo';
import { Clock, RefreshCw, LogOut } from 'lucide-react';

export default function PendingApproval() {
  const { signOut, checkApprovalStatus } = useAuth();
  const [checking, setChecking] = useState(false);

  const handleCheckStatus = async () => {
    setChecking(true);
    await checkApprovalStatus();
    setChecking(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 p-4 pt-safe pb-safe">
      <Card className="w-full max-w-md bg-gradient-to-b from-white to-amber-50/50 shadow-2xl shadow-black/40 border-0 ring-1 ring-amber-200/50">
        <CardHeader className="text-center pb-2">
          <div className="flex flex-col items-center gap-6">
            <BrandLogoLight size="lg" />
            
            {/* Animated clock icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400/30 rounded-full blur-xl animate-pulse" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-b from-amber-100 to-amber-50 shadow-lg flex items-center justify-center ring-4 ring-amber-400/50">
                <Clock className="w-10 h-10 text-amber-600 animate-[spin_8s_linear_infinite]" />
              </div>
            </div>
            
            <div>
              <CardTitle className="text-xl font-bold text-emerald-800">
                Aguardando Aprovação
              </CardTitle>
              <CardDescription className="text-emerald-600 mt-2 text-base">
                Sua conta foi criada com sucesso!
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
            <p className="text-sm text-emerald-700 text-center leading-relaxed">
              Um administrador precisa aprovar seu acesso antes que você possa utilizar o sistema.
              Você receberá uma notificação assim que sua conta for aprovada.
            </p>
          </div>
          
          <div className="space-y-3">
            <Button
              onClick={handleCheckStatus}
              disabled={checking}
              className="w-full h-12 bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-lg"
            >
              {checking ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Verificar Status
                </>
              )}
            </Button>
            
            <Button
              variant="ghost"
              onClick={signOut}
              className="w-full h-12 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair da Conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
