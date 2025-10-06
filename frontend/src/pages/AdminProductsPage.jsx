import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, Edit, Trash2, Search, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import apiService from '../services/api';

function AdminProductsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    image_url: '',
    active: true,
  });

  useEffect(() => {
    if (!apiService.isAuthenticated()) {
      navigate('/admin/login');
      return;
    }
    loadProducts();
  }, [navigate]);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os produtos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredProducts(filtered);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSwitchChange = (checked) => {
    setForm(prev => ({ ...prev, active: checked }));
  };

  const openCreateModal = () => {
    setCurrentProduct(null);
    setForm({
      name: '',
      description: '',
      price: '',
      stock: '',
      category: '',
      image_url: '',
      active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setCurrentProduct(product);
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      category: product.category || '',
      image_url: product.image_url || '',
      active: product.active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentProduct) {
        await apiService.updateProduct(currentProduct.id, form);
        toast({
          title: 'Sucesso',
          description: 'Produto atualizado com sucesso.',
        });
      } else {
        await apiService.createProduct(form);
        toast({
          title: 'Sucesso',
          description: 'Produto criado com sucesso.',
        });
      }
      setIsModalOpen(false);
      loadProducts();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o produto.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Tem certeza que deseja desativar este produto?')) {
      try {
        await apiService.deleteProduct(productId);
        toast({
          title: 'Sucesso',
          description: 'Produto desativado com sucesso.',
        });
        loadProducts();
      } catch (error) {
        console.error('Erro ao desativar produto:', error);
        toast({
          title: 'Erro',
          description: error.message || 'Não foi possível desativar o produto.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Gestão de Produtos</h1>
          <p className="text-muted-foreground">
            Visualize, adicione, edite e remova produtos da geladeira
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={loadProducts}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando produtos...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum produto encontrado.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {product.image_url && (
                          <img src={product.image_url} alt={product.name} className="w-8 h-8 rounded-md object-cover" />
                        )}
                        {product.name}
                      </div>
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{apiService.formatPrice(product.price)}</TableCell>
                    <TableCell>
                      <Badge variant={product.stock < 5 ? 'destructive' : 'secondary'}>
                        {product.stock}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.active ? 'default' : 'outline'}>
                        {product.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(product)} className="mr-2">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(product.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{currentProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
            <DialogDescription>
              {currentProduct ? 'Edite os detalhes do produto.' : 'Adicione um novo produto à geladeira.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nome</Label>
              <Input id="name" name="name" value={form.name} onChange={handleFormChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Descrição</Label>
              <Textarea id="description" name="description" value={form.description} onChange={handleFormChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">Preço</Label>
              <Input id="price" name="price" type="number" step="0.01" value={form.price} onChange={handleFormChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stock" className="text-right">Estoque</Label>
              <Input id="stock" name="stock" type="number" value={form.stock} onChange={handleFormChange} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">Categoria</Label>
              <Input id="category" name="category" value={form.category} onChange={handleFormChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image_url" className="text-right">URL da Imagem</Label>
              <Input id="image_url" name="image_url" value={form.image_url} onChange={handleFormChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="active" className="text-right">Ativo</Label>
              <Switch
                id="active"
                name="active"
                checked={form.active}
                onCheckedChange={handleSwitchChange}
                className="col-span-3 justify-self-start"
              />
            </div>
            <DialogFooter>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminProductsPage;
