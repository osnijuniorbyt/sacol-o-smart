import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
      {/* Background premium com gradiente verde escuro */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(150,50%,12%)] via-[hsl(150,45%,16%)] to-[hsl(150,50%,10%)]" />
      
      {/* Decoração lateral - faixa laranja */}
      <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-primary via-[hsl(36,90%,45%)] to-primary" />
      <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-b from-primary via-[hsl(36,90%,45%)] to-primary" />
      
      {/* Efeito de brilho sutil */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(36,90%,50%,0.1)_0%,_transparent_50%)]" />
      
      {/* Card principal com estética premium */}
      <div className="relative w-full max-w-md">
        {/* Borda metálica externa */}
        <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-b from-[hsl(36,70%,60%)] via-[hsl(36,60%,45%)] to-[hsl(36,50%,30%)] opacity-60" />
        
        {/* Card interno */}
        <div className="relative rounded-2xl overflow-hidden">
          {/* Fundo com gradiente premium cream */}
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(40,35%,96%)] via-[hsl(40,30%,94%)] to-[hsl(40,25%,90%)]" />
          
          {/* Textura sutil */}
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }} />
          
          <div className="relative p-4 sm:p-6">
            {/* Logo Container Premium - Fundo cinza integrado ao xadrez */}
            <div className="relative mb-6 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6">
              {/* Fundo que combina com o padrão xadrez cinza da imagem (#808080 e #C0C0C0) */}
              <div className="relative py-6 px-4" style={{ backgroundColor: '#a0a0a0' }}>
                {/* Borda metálica inferior */}
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[hsl(36,70%,55%)] to-transparent" />
                
                {/* Logo centralizada */}
                <div className="relative flex justify-center">
                  <BrandLogoLight size="xl" />
                </div>
              </div>
              
              {/* Detalhes laterais metálicos */}
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[hsl(36,60%,65%)] via-[hsl(36,50%,50%)] to-[hsl(36,40%,40%)]" />
              <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[hsl(36,60%,65%)] via-[hsl(36,50%,50%)] to-[hsl(36,40%,40%)]" />
            </div>
            
            {/* Tabs com estilo premium */}
            <Tabs defaultValue="login" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 h-14 p-1 bg-[hsl(40,20%,88%)] rounded-xl">
                <TabsTrigger 
                  value="login" 
                  className="h-12 text-base font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-accent data-[state=active]:shadow-md transition-all"
                >
                  Entrar
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  className="h-12 text-base font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-accent data-[state=active]:shadow-md transition-all"
                >
                  Cadastrar
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-accent font-medium">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="h-14 bg-white/80 border-[hsl(40,25%,80%)] focus:border-primary focus:ring-primary/30 text-base rounded-xl"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-accent font-medium">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-14 bg-white/80 border-[hsl(40,25%,80%)] focus:border-primary focus:ring-primary/30 text-base rounded-xl"
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
                    className="text-sm text-accent hover:text-primary font-medium hover:underline transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                  
                  {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                  
                  {/* Botão premium com gradiente laranja */}
                  <Button 
                    type="submit" 
                    className="w-full h-16 text-lg font-bold rounded-xl bg-gradient-to-b from-[hsl(36,90%,55%)] via-[hsl(36,90%,50%)] to-[hsl(36,90%,40%)] hover:from-[hsl(36,90%,60%)] hover:via-[hsl(36,90%,55%)] hover:to-[hsl(36,90%,45%)] text-white shadow-lg shadow-[hsl(36,90%,30%,0.4)] transition-all duration-200 hover:shadow-xl hover:scale-[1.02] border-t border-[hsl(36,80%,70%,0.5)]" 
                    disabled={loading}
                  >
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-accent font-medium">E-mail</Label>
                    <Input
                      id="register-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="h-14 bg-white/80 border-[hsl(40,25%,80%)] focus:border-primary focus:ring-primary/30 text-base rounded-xl"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-accent font-medium">Senha</Label>
                    <Input
                      id="register-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-14 bg-white/80 border-[hsl(40,25%,80%)] focus:border-primary focus:ring-primary/30 text-base rounded-xl"
                      autoComplete="new-password"
                      minLength={6}
                      required
                    />
                  </div>
                  
                  <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                    <p className="text-sm text-accent/80 font-medium">
                      Após o cadastro, um administrador precisará aprovar seu acesso ao sistema.
                    </p>
                  </div>
                  
                  {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                  
                  <Button 
                    type="submit" 
                    className="w-full h-16 text-lg font-bold rounded-xl bg-gradient-to-b from-[hsl(36,90%,55%)] via-[hsl(36,90%,50%)] to-[hsl(36,90%,40%)] hover:from-[hsl(36,90%,60%)] hover:via-[hsl(36,90%,55%)] hover:to-[hsl(36,90%,45%)] text-white shadow-lg shadow-[hsl(36,90%,30%,0.4)] transition-all duration-200 hover:shadow-xl hover:scale-[1.02] border-t border-[hsl(36,80%,70%,0.5)]" 
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

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-md bg-gradient-to-b from-[hsl(40,35%,96%)] to-[hsl(40,30%,92%)] border-[hsl(36,60%,60%)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-accent">
              <Mail className="w-5 h-5 text-primary" />
              Recuperar Senha
            </DialogTitle>
            <DialogDescription>
              Digite seu e-mail para receber o link de recuperação.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-accent">E-mail</Label>
              <Input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="seu@email.com"
                className="h-12 bg-white/80 border-[hsl(40,25%,80%)]"
                required
              />
            </div>
            
            {resetMessage && (
              <div className={`text-sm ${resetMessage.includes('enviado') ? 'text-accent' : 'text-destructive'}`}>
                <p className="font-medium">{resetMessage}</p>
                {resetMessage.includes('enviado') && (
                  <div className="mt-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-xs text-accent font-medium mb-1">📧 Dicas importantes:</p>
                    <ul className="text-xs text-accent/70 space-y-1 list-disc list-inside">
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
                className="border-[hsl(40,25%,75%)]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={resetLoading}
                className="bg-gradient-to-b from-primary to-[hsl(36,90%,40%)] hover:from-[hsl(36,90%,55%)] hover:to-[hsl(36,90%,45%)]"
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
