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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 p-4 pt-safe pb-safe">
      <Card className="w-full max-w-md bg-gradient-to-b from-white to-amber-50/50 shadow-2xl shadow-black/40 border-0 ring-1 ring-amber-200/50">
        <CardHeader className="text-center pb-2">
          <div className="flex flex-col items-center gap-4">
            {/* 3D Metallic Logo Container */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-3xl blur-md opacity-60 scale-105"></div>
              <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-b from-amber-100 via-white to-amber-50 shadow-xl flex items-center justify-center p-3 ring-4 ring-amber-400/50 border-t-2 border-amber-200">
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 p-2 shadow-inner">
                  <img 
                    src={logoHorticampos} 
                    alt="Horti Campos" 
                    className="w-full h-full object-contain drop-shadow-lg"
                  />
                </div>
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 bg-clip-text text-transparent drop-shadow-sm">Horti Campos</CardTitle>
              <CardDescription className="text-emerald-700 font-medium mt-1">Hortifruti & Produtos Naturais</CardDescription>
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
    </div>
  );
}
