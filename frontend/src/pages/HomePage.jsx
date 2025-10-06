import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Package, Zap, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import apiService from '../services/api';

function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  const loadFeaturedProducts = async () => {
    try {
      const products = await apiService.getProducts({ available_only: true });
      // Pegar os primeiros 4 produtos como destaque
      setFeaturedProducts(products.slice(0, 4));
    } catch (error) {
      console.error('Erro ao carregar produtos em destaque:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: 'Compra Rápida',
      description: 'Selecione seus produtos e pague em segundos com o Mercado Pago.'
    },
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: 'Pagamento Seguro',
      description: 'Transações protegidas com a segurança do Mercado Pago.'
    },
    {
      icon: <Package className="h-8 w-8 text-primary" />,
      title: 'Produtos Frescos',
      description: 'Bebidas geladas, lanches e doces sempre frescos e disponíveis.'
    },
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      title: 'Disponível 24/7',
      description: 'Acesso aos produtos a qualquer hora do dia ou da noite.'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Geladeira
              <span className="text-primary"> Inteligente</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Sua vending machine inteligente com produtos frescos, pagamento digital 
              e liberação automática. Tecnologia e praticidade em suas mãos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/produtos">
                <Button size="lg" className="w-full sm:w-auto">
                  Ver Produtos
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Como Funciona
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Por que escolher nossa geladeira inteligente?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tecnologia de ponta para uma experiência de compra única e conveniente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Produtos em Destaque
            </h2>
            <p className="text-lg text-muted-foreground">
              Confira alguns dos nossos produtos mais populares
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <div className="h-48 bg-muted rounded-t-lg"></div>
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-6 bg-muted rounded w-1/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-16 w-16 text-muted-foreground" />
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-primary">
                        {apiService.formatPrice(product.price)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {product.stock} disponíveis
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/produtos">
              <Button size="lg" variant="outline">
                Ver Todos os Produtos
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Como Funciona
            </h2>
            <p className="text-lg text-muted-foreground">
              Processo simples e rápido em apenas 3 passos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Escolha seus Produtos</h3>
              <p className="text-muted-foreground">
                Navegue pelo catálogo e adicione os produtos desejados ao carrinho
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Realize o Pagamento</h3>
              <p className="text-muted-foreground">
                Pague de forma segura através do Mercado Pago com PIX, cartão ou boleto
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Retire seus Produtos</h3>
              <p className="text-muted-foreground">
                Após a confirmação do pagamento, a geladeira será liberada automaticamente
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
