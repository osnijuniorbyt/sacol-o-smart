import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { BrandLogoLight } from '@/components/BrandLogo';
import { KeyRound, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { updatePassword, session } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Verificar se há sessão ativa (token do email)
  useEffect(() => {
    if (!session) {
      // Aguardar um pouco para o Supabase processar o token da URL
      const timer = setTimeout(() => {
        if (!session) {
          navigate('/login');
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [session, navigate]);

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
