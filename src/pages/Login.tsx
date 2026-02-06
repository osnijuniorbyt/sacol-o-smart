import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import logoLogin from '@/assets/logo-hortii-login.png';
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
    <div className="min-h-screen flex items-center justify-center p-4 pt-safe pb-safe relative overflow-hidden">
      {/* Background - MD3 Green gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(150,45%,15%)] via-[hsl(150,40%,18%)] to-[hsl(150,50%,12%)]" />
      
      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(150,50%,30%,0.15)_0%,_transparent_60%)]" />
      
      {/* Card principal - MD3 Style */}
      <div className="relative w-full max-w-md">
        {/* Card interno - White with shadow */}
        <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">
          
          <div className="relative p-5 sm:p-6">
            {/* Logo Container - MD3 Clean */}
            <div className="relative mb-6 -mx-5 sm:-mx-6 -mt-5 sm:-mt-6 overflow-hidden">
              <div className="relative h-[240px] sm:h-[280px] bg-gradient-to-b from-[hsl(150,40%,18%)] to-[hsl(150,45%,15%)]">
                {/* Logo preenchendo o container */}
                <img 
                  src={logoLogin}
                  alt="Horti Campos - Hortifruti e Produtos Naturais"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
                
                {/* Fade to white */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
              </div>
            </div>
            
            {/* Tabs - MD3 Pill Style */}
            <Tabs defaultValue="login" className="space-y-5">
              <TabsList className="grid w-full grid-cols-2 h-14 p-1.5 bg-gray-100 rounded-full">
                <TabsTrigger 
                  value="login" 
                  className="h-full text-base font-semibold rounded-full data-[state=active]:bg-white data-[state=active]:shadow-md transition-all"
                >
                  Entrar
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  className="h-full text-base font-semibold rounded-full data-[state=active]:bg-white data-[state=active]:shadow-md transition-all"
                >
                  Cadastrar
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-medium">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="h-14 bg-gray-50 border-0 focus:ring-2 focus:ring-primary/30 text-base rounded-xl"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700 font-medium">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-14 bg-gray-50 border-0 focus:ring-2 focus:ring-primary/30 text-base rounded-xl"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setResetMessage('');
                      setResetDialogOpen(true);
                    }}
                    className="text-sm text-gray-500 hover:text-primary font-medium hover:underline transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                  
                  {error && <p className="text-sm text-red-600 font-medium bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                  
                  {/* Botão - MD3 Style */}
                  <Button 
                    type="submit" 
                    className="w-full h-14 text-lg font-bold rounded-xl shadow-lg transition-all duration-200 hover:scale-[1.02]" 
                    disabled={loading}
                  >
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-gray-700 font-medium">E-mail</Label>
                    <Input
                      id="register-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="h-14 bg-gray-50 border-0 focus:ring-2 focus:ring-primary/30 text-base rounded-xl"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-gray-700 font-medium">Senha</Label>
                    <Input
                      id="register-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-14 bg-gray-50 border-0 focus:ring-2 focus:ring-primary/30 text-base rounded-xl"
                      autoComplete="new-password"
                      minLength={6}
                      required
                    />
                  </div>
                  
                  <div className="bg-amber-50 rounded-xl p-4">
                    <p className="text-sm text-amber-800 font-medium">
                      Após o cadastro, um administrador precisará aprovar seu acesso ao sistema.
                    </p>
                  </div>
                  
                  {error && <p className="text-sm text-red-600 font-medium bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                  
                  <Button 
                    type="submit" 
                    className="w-full h-14 text-lg font-bold rounded-xl shadow-lg transition-all duration-200 hover:scale-[1.02]" 
                    disabled={loading}
                  >
                    {loading ? 'Cadastrando...' : 'Cadastrar'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Reset Password Dialog - MD3 Style */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-800">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              Recuperar Senha
            </DialogTitle>
            <DialogDescription>
              Digite seu e-mail para receber o link de recuperação.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-gray-700">E-mail</Label>
              <Input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="seu@email.com"
                className="h-12 bg-gray-50 border-0 rounded-xl"
                required
              />
            </div>
            
            {resetMessage && (
              <div className={`text-sm rounded-xl p-3 ${resetMessage.includes('enviado') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                <p className="font-medium">{resetMessage}</p>
                {resetMessage.includes('enviado') && (
                  <div className="mt-3 p-3 bg-white/50 rounded-lg">
                    <p className="text-xs font-medium mb-1">📧 Dicas importantes:</p>
                    <ul className="text-xs space-y-1 list-disc list-inside opacity-80">
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
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={resetLoading}
                className="rounded-xl"
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
