import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '../contexts/CartContext';
import apiService from '../services/api';

function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCart();
  const { toast } = useToast();
  
  const [customerInfo, setCustomerInfo] = useState({
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(productId);
      return;
    }

    const item = items.find(item => item.product.id === productId);
    if (newQuantity > item.product.stock) {
      toast({
        title: 'Limite de estoque',
        description: `Apenas ${item.product.stock} unidades disponíveis.`,
        variant: 'destructive',
      });
      return;
    }

    updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = (productId) => {
    removeItem(productId);
    toast({
      title: 'Produto removido',
      description: 'O produto foi removido do carrinho.',
    });
  };

  const handleClearCart = () => {
    clearCart();
    toast({
      title: 'Carrinho limpo',
      description: 'Todos os produtos foram removidos do carrinho.',
    });
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast({
        title: 'Carrinho vazio',
        description: 'Adicione produtos ao carrinho antes de finalizar a compra.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Verificar disponibilidade dos produtos
      const cartItems = items.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity
      }));

      const availabilityCheck = await apiService.checkAvailability(cartItems);
      
      const unavailableItems = availabilityCheck.availability.filter(item => !item.available);
      if (unavailableItems.length > 0) {
        toast({
          title: 'Produtos indisponíveis',
          description: 'Alguns produtos não estão mais disponíveis. Verifique seu carrinho.',
          variant: 'destructive',
        });
        return;
      }

      // Criar pedido
      const orderData = {
        items: cartItems,
        customer_email: customerInfo.email || undefined,
        customer_phone: customerInfo.phone || undefined
      };

      const order = await apiService.createOrder(orderData);
      
      // Navegar para página de pagamento
      navigate('/pagamento', { 
        state: { 
          order: order,
          customerInfo: customerInfo 
        } 
      });

    } catch (error) {
      console.error('Erro ao finalizar compra:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível finalizar a compra. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = getTotalPrice();

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Seu carrinho está vazio
          </h2>
          <p className="text-muted-foreground mb-6">
            Adicione alguns produtos para começar suas compras
          </p>
          <Link to="/produtos">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continuar Comprando
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Carrinho de Compras</h1>
        <p className="text-muted-foreground">
          Revise seus produtos e finalize sua compra
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista de produtos */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Produtos ({items.length})</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearCart}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Carrinho
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.product.image_url ? (
                      <img 
                        src={item.product.image_url} 
                        alt={item.product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{item.product.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.product.description}</p>
                    <p className="text-lg font-bold text-primary mt-1">
                      {apiService.formatPrice(item.product.price)}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-foreground">
                      {apiService.formatPrice(item.product.price * item.quantity)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.product.id)}
                      className="text-destructive hover:text-destructive mt-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Resumo e checkout */}
        <div className="space-y-6">
          {/* Informações do cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">E-mail (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone (opcional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Resumo do pedido */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span>{item.product.name} x{item.quantity}</span>
                    <span>{apiService.formatPrice(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{apiService.formatPrice(totalPrice)}</span>
              </div>
              
              <div className="space-y-2 pt-4">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleCheckout}
                  disabled={loading}
                >
                  {loading ? 'Processando...' : 'Finalizar Compra'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                
                <Link to="/produtos">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Continuar Comprando
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
