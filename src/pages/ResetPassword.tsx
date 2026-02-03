import { useState, useEffect } from 'react';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { BrandLogoLight } from '@/components/BrandLogo';
import { KeyRound, CheckCircle, Link2, AlertCircle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { updatePassword, session, loading: authLoading, isPasswordRecovery, clearPasswordRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Manual link fallback
  const [manualLink, setManualLink] = useState('');
  const [processingLink, setProcessingLink] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  // Check URL for recovery tokens on mount
  useEffect(() => {
    const hash = location.hash;
    if (hash && hash.includes('access_token')) {
      // Token is in URL, Supabase will handle it automatically
      return;
    }
  }, [location]);

  const handleManualLink = async () => {
    setLinkError('');
    setProcessingLink(true);

    try {
      // Extract token from pasted link
      let tokenData: { access_token?: string; refresh_token?: string; type?: string } = {};
      
      // Try to parse the link
      if (manualLink.includes('#')) {
        const hashPart = manualLink.split('#')[1];
        const params = new URLSearchParams(hashPart);
        tokenData = {
          access_token: params.get('access_token') || undefined,
          refresh_token: params.get('refresh_token') || undefined,
          type: params.get('type') || undefined,
        };
      } else if (manualLink.includes('?')) {
        const queryPart = manualLink.split('?')[1];
        const params = new URLSearchParams(queryPart);
        tokenData = {
          access_token: params.get('access_token') || undefined,
          refresh_token: params.get('refresh_token') || undefined,
          type: params.get('type') || undefined,
        };
      }

      if (!tokenData.access_token) {
        setLinkError('Link inválido. Cole o link completo do email.');
        setProcessingLink(false);
        return;
      }

      // Set session with the token
      const { error } = await supabase.auth.setSession({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || '',
      });

      if (error) {
        setLinkError('Link expirado ou inválido. Solicite um novo link.');
      } else {
        setManualLink('');
        setShowManualInput(false);
        // Session is now set, the component will re-render and show the password form
      }
    } catch (err) {
      setLinkError('Erro ao processar o link. Tente novamente.');
    }

    setProcessingLink(false);
  };

  // Mostrar loading apenas enquanto auth carrega
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
          <p className="text-amber-200 text-sm">Verificando link...</p>
        </div>
      </div>
    );
  }

  // Se não tem sessão E não está em modo recovery → mostrar opção de colar link
  if (!session && !isPasswordRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 p-4 pt-safe pb-safe">
        <Card className="w-full max-w-md bg-gradient-to-b from-white to-amber-50/50 shadow-2xl shadow-black/40 border-0 ring-1 ring-amber-200/50">
          <CardHeader className="text-center pb-2">
            <div className="flex flex-col items-center gap-4">
              <BrandLogoLight size="md" />
              
              <div className="w-16 h-16 rounded-full bg-gradient-to-b from-amber-100 to-amber-50 shadow-lg flex items-center justify-center ring-4 ring-amber-400/50">
                <Link2 className="w-8 h-8 text-amber-600" />
              </div>
              
              <div>
                <CardTitle className="text-xl font-bold text-emerald-800">
                  Recuperar Senha
                </CardTitle>
                <CardDescription className="text-emerald-600 mt-1">
                  Cole o link que você recebeu por email
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-700">
                  <p className="font-medium mb-1">Não recebeu o link automaticamente?</p>
                  <p className="text-xs">Cole o link completo do email abaixo. Se o botão do email não funcionar, copie todo o endereço do link.</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="manual-link">Link de Recuperação</Label>
              <Input
                id="manual-link"
                type="text"
                value={manualLink}
                onChange={(e) => setManualLink(e.target.value)}
                placeholder="Cole aqui o link do email..."
                className="h-12 text-sm"
              />
            </div>
            
            {linkError && (
              <p className="text-sm text-destructive">{linkError}</p>
            )}
            
            <Button
              onClick={handleManualLink}
              className="w-full h-14 text-base font-bold bg-gradient-to-b from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:via-amber-500 hover:to-amber-600 text-white shadow-lg shadow-amber-900/40 transition-all duration-200 hover:shadow-xl border-t border-amber-300/50 hover:scale-[1.02]"
              disabled={processingLink || !manualLink.trim()}
            >
              {processingLink ? 'Verificando...' : 'Verificar Link'}
            </Button>
            
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                ← Voltar para o login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    const { error } = await updatePassword(password);

    if (error) {
      setError(error.message);
    } else {
      clearPasswordRecovery();
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 p-4">
        <Card className="w-full max-w-md bg-gradient-to-b from-white to-amber-50/50 shadow-2xl shadow-black/40 border-0 ring-1 ring-amber-200/50">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-emerald-800">Senha Alterada!</h2>
              <p className="text-emerald-600">Redirecionando...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 p-4 pt-safe pb-safe">
      <Card className="w-full max-w-md bg-gradient-to-b from-white to-amber-50/50 shadow-2xl shadow-black/40 border-0 ring-1 ring-amber-200/50">
        <CardHeader className="text-center pb-2">
          <div className="flex flex-col items-center gap-4">
            <BrandLogoLight size="md" />
            
            <div className="w-16 h-16 rounded-full bg-gradient-to-b from-amber-100 to-amber-50 shadow-lg flex items-center justify-center ring-4 ring-amber-400/50">
              <KeyRound className="w-8 h-8 text-amber-600" />
            </div>
            
            <div>
              <CardTitle className="text-xl font-bold text-emerald-800">
                Nova Senha
              </CardTitle>
              <CardDescription className="text-emerald-600 mt-1">
                Digite sua nova senha abaixo
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
            
            {error && <p className="text-sm text-destructive">{error}</p>}
            
            <Button
              type="submit"
              className="w-full h-14 text-base font-bold bg-gradient-to-b from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:via-amber-500 hover:to-amber-600 text-white shadow-lg shadow-amber-900/40 transition-all duration-200 hover:shadow-xl border-t border-amber-300/50 hover:scale-[1.02]"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Nova Senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
