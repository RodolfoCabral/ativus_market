import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '../contexts/CartContext';
import apiService from '../services/api';

function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  
  const order = location.state?.order;
  const customerInfo = location.state?.customerInfo;

  useEffect(() => {
    if (!order) {
      navigate('/carrinho');
      return;
    }

    createPaymentPreference();
  }, [order]);

  const createPaymentPreference = async () => {
    try {
      setLoading(true);
      
      const response = await apiService.createPayment({
        order_id: order.id
      });

      if (response.success) {
        setPaymentData(response);
        
        // Limpar carrinho após criar preferência de pagamento
        clearCart();
      } else {
        throw new Error(response.error || 'Erro ao criar preferência de pagamento');
      }
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      toast({
        title: 'Erro no pagamento',
        description: error.message || 'Não foi possível processar o pagamento. Tente novamente.',
        variant: 'destructive',
      });
      navigate('/carrinho');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    if (paymentData?.init_point) {
      // Redirecionar para o Mercado Pago
      window.location.href = paymentData.init_point;
    }
  };

  if (!order) {
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <Loader2 className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Preparando pagamento...
          </h2>
          <p className="text-muted-foreground">
            Aguarde enquanto configuramos seu pagamento
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/carrinho')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Carrinho
        </Button>
        
        <h1 className="text-3xl font-bold text-foreground mb-2">Pagamento</h1>
        <p className="text-muted-foreground">
          Finalize sua compra de forma segura com o Mercado Pago
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Resumo do pedido */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Quantidade: {item.quantity} x {apiService.formatPrice(item.unit_price)}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {apiService.formatPrice(item.total_price)}
                  </p>
                </div>
              ))}
            </div>
            
            <Separator />
            
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">
                {apiService.formatPrice(order.total_amount)}
              </span>
            </div>

            {customerInfo && (customerInfo.email || customerInfo.phone) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium">Informações de Contato</h4>
                  {customerInfo.email && (
                    <p className="text-sm text-muted-foreground">
                      E-mail: {customerInfo.email}
                    </p>
                  )}
                  {customerInfo.phone && (
                    <p className="text-sm text-muted-foreground">
                      Telefone: {customerInfo.phone}
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Opções de pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Pagamento Seguro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="bg-primary/10 rounded-lg p-6 mb-4">
                <CreditCard className="h-12 w-12 text-primary mx-auto mb-3" />
                <h3 className="text-lg font-semibold mb-2">Mercado Pago</h3>
                <p className="text-sm text-muted-foreground">
                  Pague com PIX, cartão de crédito, débito ou boleto bancário
                </p>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Você será redirecionado para o ambiente seguro do Mercado Pago
                </p>
                
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={handlePayment}
                  disabled={!paymentData}
                >
                  Pagar {apiService.formatPrice(order.total_amount)}
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium">Formas de Pagamento Aceitas:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div>• PIX (instantâneo)</div>
                <div>• Cartão de Crédito</div>
                <div>• Cartão de Débito</div>
                <div>• Boleto Bancário</div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Informações Importantes:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Após a confirmação do pagamento, a geladeira será liberada automaticamente</li>
                <li>• O tempo de liberação é de até 2 minutos após a aprovação</li>
                <li>• Você receberá uma confirmação por e-mail (se fornecido)</li>
                <li>• Em caso de problemas, entre em contato conosco</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações de segurança */}
      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="font-semibold mb-2">🔒 Pagamento 100% Seguro</h3>
            <p className="text-sm text-muted-foreground">
              Seus dados estão protegidos pela criptografia SSL do Mercado Pago. 
              Não armazenamos informações de cartão de crédito.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PaymentPage;
