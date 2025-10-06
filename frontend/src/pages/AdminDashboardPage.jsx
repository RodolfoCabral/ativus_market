import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Wifi,
  WifiOff,
  Unlock,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import apiService from '../services/api';

function AdminDashboardPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [stats, setStats] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar autenticação
    if (!apiService.isAuthenticated()) {
      navigate('/admin/login');
      return;
    }

    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [dashboardData, statusData] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getSystemStatus()
      ]);
      
      setStats(dashboardData);
      setSystemStatus(statusData);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do dashboard.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualUnlock = async () => {
    try {
      const result = await apiService.manualUnlock(60);
      
      if (result.success) {
        toast({
          title: 'Geladeira desbloqueada',
          description: 'A geladeira foi desbloqueada manualmente por 60 segundos.',
        });
      } else {
        throw new Error(result.error || 'Erro ao desbloquear');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível desbloquear a geladeira.',
        variant: 'destructive',
      });
    }
  };

  const handleTestEsp = async () => {
    try {
      const result = await apiService.testEsp();
      
      if (result.success) {
        toast({
          title: 'Teste realizado',
          description: 'Conexão com ESP8266 testada com sucesso.',
        });
      } else {
        throw new Error(result.error || 'Erro no teste');
      }
    } catch (error) {
      toast({
        title: 'Erro no teste',
        description: error.message || 'Não foi possível conectar com o ESP8266.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema e controles da geladeira inteligente
        </p>
      </div>

      {/* Estatísticas principais */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produtos Ativos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.stats.active_products}</div>
              <p className="text-xs text-muted-foreground">
                de {stats.stats.total_products} produtos cadastrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Pagos</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.stats.paid_orders}</div>
              <p className="text-xs text-muted-foreground">
                de {stats.stats.total_orders} pedidos totais
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendas do Mês</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {apiService.formatPrice(stats.stats.monthly_sales)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.stats.monthly_orders} pedidos este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendas da Semana</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {apiService.formatPrice(stats.stats.weekly_sales)}
              </div>
              <p className="text-xs text-muted-foreground">
                últimos 7 dias
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Status do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {systemStatus && (
              <>
                <div className="flex items-center justify-between">
                  <span>Sistema Online</span>
                  <Badge variant="default">
                    {systemStatus.status === 'online' ? 'Online' : 'Offline'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Mercado Pago</span>
                  <Badge variant={systemStatus.mercadopago_configured ? 'default' : 'destructive'}>
                    {systemStatus.mercadopago_configured ? 'Configurado' : 'Não Configurado'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>ESP8266</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant={systemStatus.esp8266_configured ? 'default' : 'destructive'}>
                      {systemStatus.esp8266_configured ? 'Configurado' : 'Não Configurado'}
                    </Badge>
                    {systemStatus.esp8266_configured ? (
                      <Wifi className="h-4 w-4 text-green-500" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
                
                {systemStatus.esp8266_ip && (
                  <div className="text-sm text-muted-foreground">
                    IP do ESP8266: {systemStatus.esp8266_ip}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Controles da Geladeira */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Unlock className="h-5 w-5 mr-2" />
              Controles da Geladeira
            </CardTitle>
            <CardDescription>
              Controles manuais para testes e manutenção
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleManualUnlock}
              className="w-full"
              variant="outline"
            >
              <Unlock className="h-4 w-4 mr-2" />
              Desbloquear Manualmente (60s)
            </Button>
            
            <Button 
              onClick={handleTestEsp}
              className="w-full"
              variant="outline"
            >
              <Wifi className="h-4 w-4 mr-2" />
              Testar Conexão ESP8266
            </Button>
            
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>Atenção:</strong> Use os controles manuais apenas para testes 
                ou em situações de emergência.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Produtos com baixo estoque */}
      {stats && stats.low_stock_products && stats.low_stock_products.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
              Produtos com Baixo Estoque
            </CardTitle>
            <CardDescription>
              Produtos com menos de 5 unidades em estoque
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.low_stock_products.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive">
                      {product.stock} unidades
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {apiService.formatPrice(product.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transações recentes */}
      {stats && stats.recent_transactions && stats.recent_transactions.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
            <CardDescription>
              Últimas 10 transações aprovadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recent_transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {transaction.external_reference || `Pagamento ${transaction.payment_id}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {apiService.formatDate(transaction.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {apiService.formatPrice(transaction.amount)}
                    </p>
                    <Badge variant="default" className="text-xs">
                      {transaction.payment_status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AdminDashboardPage;
