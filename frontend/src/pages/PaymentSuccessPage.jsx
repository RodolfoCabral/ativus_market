import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Package, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import apiService from '../services/api';

function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const paymentId = searchParams.get('payment_id');
  const externalReference = searchParams.get('external_reference');
  const status = searchParams.get('status');

  useEffect(() => {
    if (externalReference) {
      loadOrderInfo();
    } else {
      setLoading(false);
    }
  }, [externalReference]);

  const loadOrderInfo = async () => {
    try {
      const orderData = await apiService.getOrderByReference(externalReference);
      setOrder(orderData);
    } catch (error) {
      console.error('Erro ao carregar pedido:', error);
      setError('Não foi possível carregar as informações do pedido.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = () => {
    switch (status) {
      case 'approved':
        return {
          icon: <CheckCircle className="h-16 w-16 text-green-500" />,
          title: 'Pagamento Aprovado!',
          description: 'Seu pagamento foi processado com sucesso.',
          variant: 'success'
        };
      case 'pending':
        return {
          icon: <RefreshCw className="h-16 w-16 text-yellow-500" />,
          title: 'Pagamento Pendente',
          description: 'Seu pagamento está sendo processado.',
          variant: 'warning'
        };
      default:
        return {
          icon: <CheckCircle className="h-16 w-16 text-green-500" />,
          title: 'Compra Realizada!',
          description: 'Obrigado pela sua compra.',
          variant: 'success'
        };
    }
  };

  const statusInfo = getStatusInfo();

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <RefreshCw className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Carregando informações...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        {statusInfo.icon}
        <h1 className="text-3xl font-bold text-foreground mt-4 mb-2">
          {statusInfo.title}
        </h1>
        <p className="text-lg text-muted-foreground">
          {statusInfo.description}
        </p>
      </div>

      {order && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Detalhes do Pedido</span>
              <Badge variant={order.status === 'paid' ? 'default' : 'secondary'}>
                {order.status === 'paid' ? 'Pago' : order.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Número do Pedido</p>
                <p className="font-medium">{order.external_reference}</p>
              </div>
              {paymentId && (
                <div>
                  <p className="text-sm text-muted-foreground">ID do Pagamento</p>
                  <p className="font-medium">{paymentId}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Total Pago</p>
                <p className="font-medium text-primary">
                  {apiService.formatPrice(order.total_amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data</p>
                <p className="font-medium">
                  {apiService.formatDate(order.created_at)}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Produtos Comprados:</h4>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantidade: {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {apiService.formatPrice(item.total_price)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {status === 'approved' && (
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <Package className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Geladeira Liberada!
              </h3>
              <p className="text-green-700">
                A trava magnética foi liberada automaticamente. 
                Você pode retirar seus produtos agora.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {status === 'pending' && (
        <Card className="mb-8 border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Aguardando Confirmação
              </h3>
              <p className="text-yellow-700">
                Seu pagamento está sendo processado. A geladeira será liberada 
                assim que o pagamento for confirmado.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="mb-8 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-700">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/produtos">
            <Button variant="outline" className="w-full sm:w-auto">
              <Package className="h-4 w-4 mr-2" />
              Comprar Mais Produtos
            </Button>
          </Link>
          <Link to="/">
            <Button className="w-full sm:w-auto">
              <Home className="h-4 w-4 mr-2" />
              Voltar ao Início
            </Button>
          </Link>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>
            Em caso de problemas, entre em contato conosco informando o número do pedido.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccessPage;
