import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import logoHorticampos from '@/assets/logo-horticampos.jpeg';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 pt-safe pb-safe">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="flex flex-col items-center gap-4">
            <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg flex items-center justify-center p-3 ring-2 ring-primary/20">
              <img 
                src={logoHorticampos} 
                alt="Horti Campos" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Horti Campos</CardTitle>
              <CardDescription className="text-sm mt-1">Hortifruti & Produtos Naturais</CardDescription>
            </div>
          </div>
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
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button 
                  type="submit" 
                  className="w-full h-14 text-base font-semibold bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 hover:from-slate-500 hover:via-slate-600 hover:to-slate-700 text-white shadow-lg shadow-slate-500/30 transition-all duration-200 hover:shadow-xl border-t border-slate-400/30" 
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
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button 
                  type="submit" 
                  className="w-full h-14 text-base font-semibold bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 hover:from-slate-500 hover:via-slate-600 hover:to-slate-700 text-white shadow-lg shadow-slate-500/30 transition-all duration-200 hover:shadow-xl border-t border-slate-400/30" 
                  disabled={loading}
                >
                  {loading ? 'Cadastrando...' : 'Cadastrar'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
