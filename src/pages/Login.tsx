import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BrandLogoLight } from '@/components/BrandLogo';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Mail } from 'lucide-react';

export default function Login() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Reset password dialog
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { error } = await signIn(email, password);
    
    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { error } = await signUp(email, password);
    
    if (error) {
      setError(error.message);
    } else {
      setError('Verifique seu e-mail para confirmar o cadastro.');
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage('');
    
    const { error } = await resetPassword(resetEmail);
    
    if (error) {
      setResetMessage(error.message);
    } else {
      setResetMessage('E-mail enviado! Verifique sua caixa de entrada.');
    }
    setResetLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 p-4 pt-safe pb-safe">
      <Card className="w-full max-w-md bg-gradient-to-b from-white to-amber-50/50 shadow-2xl shadow-black/40 border-0 ring-1 ring-amber-200/50">
        <CardHeader className="text-center pb-4 pt-6">
          <BrandLogoLight size="lg" />
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 mb-4 h-12">
              <TabsTrigger value="login" className="h-10 text-base">Entrar</TabsTrigger>
              <TabsTrigger value="register" className="h-10 text-base">Cadastrar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="h-12"
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-12"
                    autoComplete="current-password"
                    required
                  />
                </div>
                
                {/* Forgot password link */}
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setResetMessage('');
                    setResetDialogOpen(true);
                  }}
                  className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  Esqueci minha senha
                </button>
                
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button 
                  type="submit" 
                  className="w-full h-14 text-base font-bold bg-gradient-to-b from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:via-amber-500 hover:to-amber-600 text-white shadow-lg shadow-amber-900/40 transition-all duration-200 hover:shadow-xl border-t border-amber-300/50 hover:scale-[1.02]" 
                  disabled={loading}
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email">E-mail</Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="h-12"
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Senha</Label>
                  <Input
                    id="register-password"
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
                
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                  <p className="text-xs text-amber-700">
                    Após o cadastro, um administrador precisará aprovar seu acesso ao sistema.
                  </p>
                </div>
                
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button 
                  type="submit" 
                  className="w-full h-14 text-base font-bold bg-gradient-to-b from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:via-amber-500 hover:to-amber-600 text-white shadow-lg shadow-amber-900/40 transition-all duration-200 hover:shadow-xl border-t border-amber-300/50 hover:scale-[1.02]" 
                  disabled={loading}
                >
                  {loading ? 'Cadastrando...' : 'Cadastrar'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-600" />
              Recuperar Senha
            </DialogTitle>
            <DialogDescription>
              Digite seu e-mail para receber o link de recuperação.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">E-mail</Label>
              <Input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="seu@email.com"
                className="h-12"
                required
              />
            </div>
            
            {resetMessage && (
              <div className={`text-sm ${resetMessage.includes('enviado') ? 'text-emerald-600' : 'text-destructive'}`}>
                <p className="font-medium">{resetMessage}</p>
                {resetMessage.includes('enviado') && (
                  <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-xs text-amber-700 font-medium mb-1">📧 Dicas importantes:</p>
                    <ul className="text-xs text-amber-600 space-y-1 list-disc list-inside">
                      <li>Verifique também a pasta de spam</li>
                      <li>Se o botão não aparecer, copie o link do email</li>
                      <li>O link expira em 1 hora</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={resetLoading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {resetLoading ? 'Enviando...' : 'Enviar Link'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
