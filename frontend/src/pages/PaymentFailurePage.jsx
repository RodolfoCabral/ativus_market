import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

function PaymentFailurePage() {
  const [searchParams] = useSearchParams();
  
  const paymentId = searchParams.get('payment_id');
  const externalReference = searchParams.get('external_reference');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <XCircle className="h-16 w-16 text-red-500 mx-auto" />
        <h1 className="text-3xl font-bold text-foreground mt-4 mb-2">
          Pagamento Não Realizado
        </h1>
        <p className="text-lg text-muted-foreground">
          Houve um problema com o processamento do seu pagamento.
        </p>
      </div>

      <Card className="mb-8 border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              O que aconteceu?
            </h3>
            <div className="text-red-700 space-y-2">
              <p>Seu pagamento pode ter sido:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Rejeitado pelo banco ou operadora</li>
                <li>Cancelado durante o processo</li>
                <li>Interrompido por problemas técnicos</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {(paymentId || externalReference) && (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3">Informações da Transação:</h3>
            <div className="space-y-2 text-sm">
              {externalReference && (
                <div>
                  <span className="text-muted-foreground">Referência do Pedido: </span>
                  <span className="font-medium">{externalReference}</span>
                </div>
              )}
              {paymentId && (
                <div>
                  <span className="text-muted-foreground">ID do Pagamento: </span>
                  <span className="font-medium">{paymentId}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3">O que você pode fazer:</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                1
              </div>
              <div>
                <p className="font-medium">Tente novamente</p>
                <p className="text-sm text-muted-foreground">
                  Volte ao carrinho e tente realizar o pagamento novamente
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                2
              </div>
              <div>
                <p className="font-medium">Verifique seus dados</p>
                <p className="text-sm text-muted-foreground">
                  Confirme se os dados do cartão estão corretos ou tente outro método de pagamento
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                3
              </div>
              <div>
                <p className="font-medium">Entre em contato</p>
                <p className="text-sm text-muted-foreground">
                  Se o problema persistir, entre em contato conosco para obter ajuda
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/carrinho">
            <Button className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </Link>
          
          <Link to="/produtos">
            <Button variant="outline" className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Produtos
            </Button>
          </Link>
          
          <Link to="/">
            <Button variant="outline" className="w-full sm:w-auto">
              <Home className="h-4 w-4 mr-2" />
              Página Inicial
            </Button>
          </Link>
        </div>

        <div className="text-sm text-muted-foreground max-w-2xl mx-auto">
          <p>
            <strong>Importante:</strong> Nenhum valor foi cobrado. Você pode tentar realizar 
            a compra novamente sem preocupações. Se precisar de ajuda, entre em contato 
            conosco informando a referência do pedido.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PaymentFailurePage;
