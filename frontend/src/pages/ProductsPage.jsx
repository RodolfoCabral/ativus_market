import React, { useState, useEffect } from 'react';
import { Search, Filter, Package, Plus, Minus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '../contexts/CartContext';
import apiService from '../services/api';

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredProducts, setFilteredProducts] = useState([]);
  
  const { addItem, getItemQuantity, updateQuantity } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        apiService.getProducts({ available_only: true }),
        apiService.getCategories()
      ]);
      
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os produtos. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Filtrar por categoria
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const handleAddToCart = (product) => {
    if (product.stock <= 0) {
      toast({
        title: 'Produto indisponível',
        description: 'Este produto está fora de estoque.',
        variant: 'destructive',
      });
      return;
    }

    const currentQuantity = getItemQuantity(product.id);
    if (currentQuantity >= product.stock) {
      toast({
        title: 'Limite de estoque',
        description: 'Você já adicionou toda a quantidade disponível deste produto.',
        variant: 'destructive',
      });
      return;
    }

    addItem(product, 1);
    toast({
      title: 'Produto adicionado',
      description: `${product.name} foi adicionado ao carrinho.`,
    });
  };

  const handleQuantityChange = (product, newQuantity) => {
    if (newQuantity < 0) return;
    
    if (newQuantity > product.stock) {
      toast({
        title: 'Limite de estoque',
        description: `Apenas ${product.stock} unidades disponíveis.`,
        variant: 'destructive',
      });
      return;
    }

    updateQuantity(product.id, newQuantity);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <div className="h-48 bg-muted rounded-t-lg"></div>
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
                <div className="h-10 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Produtos</h1>
        <p className="text-muted-foreground">
          Escolha seus produtos favoritos e adicione ao carrinho
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Resultados */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          {filteredProducts.length} produto(s) encontrado(s)
        </p>
      </div>

      {/* Grid de produtos */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhum produto encontrado
          </h3>
          <p className="text-muted-foreground">
            Tente ajustar os filtros ou termo de busca
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const currentQuantity = getItemQuantity(product.id);
            
            return (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center relative">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="h-16 w-16 text-muted-foreground" />
                  )}
                  
                  {product.stock <= 5 && product.stock > 0 && (
                    <Badge variant="destructive" className="absolute top-2 right-2">
                      Últimas unidades
                    </Badge>
                  )}
                  
                  {product.stock === 0 && (
                    <Badge variant="secondary" className="absolute top-2 right-2">
                      Esgotado
                    </Badge>
                  )}
                </div>
                
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {product.description}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {product.category}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl font-bold text-primary">
                      {apiService.formatPrice(product.price)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {product.stock} disponíveis
                    </span>
                  </div>
                  
                  {currentQuantity > 0 ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(product, currentQuantity - 1)}
                          disabled={currentQuantity <= 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {currentQuantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(product, currentQuantity + 1)}
                          disabled={currentQuantity >= product.stock}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        no carrinho
                      </span>
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock <= 0}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {product.stock <= 0 ? 'Indisponível' : 'Adicionar ao Carrinho'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProductsPage;
