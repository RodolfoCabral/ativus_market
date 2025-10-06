import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import apiService from '../services/api';

function AdminLoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Se já está autenticado, redirecionar para dashboard
    if (apiService.isAuthenticated()) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!credentials.username || !credentials.password) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha usuário e senha.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await apiService.adminLogin(credentials);
      
      if (response.success) {
        toast({
          title: 'Login realizado',
          description: 'Bem-vindo ao painel administrativo!',
        });
        navigate('/admin/dashboard');
      } else {
        throw new Error(response.error || 'Erro no login');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      toast({
        title: 'Erro no login',
        description: error.message || 'Credenciais inválidas. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">Acesso Administrativo</CardTitle>
          <CardDescription>
            Entre com suas credenciais para acessar o painel de controle
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Digite seu usuário"
                  value={credentials.username}
                  onChange={handleInputChange}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  value={credentials.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="text-sm"
            >
              Voltar à página inicial
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminLoginPage;
