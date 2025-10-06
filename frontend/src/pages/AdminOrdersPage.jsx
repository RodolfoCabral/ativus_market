import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, RefreshCw, Search, Filter, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import apiService from '../services/api';

function AdminOrdersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (!apiService.isAuthenticated()) {
      navigate('/admin/login');
      return;
    }
    loadOrders();
  }, [navigate]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, selectedStatus]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAllOrders();
      setOrders(data.orders);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os pedidos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(order => order.status === selectedStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.external_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.payment_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredOrders(filtered);
  };

  const openOrderDetailsModal = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Gestão de Pedidos</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie todos os pedidos realizados na geladeira
          </p>
        </div>
        <Button onClick={loadOrders}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pedidos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando pedidos...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum pedido encontrado.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referência</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.external_reference}</TableCell>
                    <TableCell>{apiService.formatPrice(order.total_amount)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.payment_status)}>
                        {order.payment_status || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>{apiService.formatDate(order.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openOrderDetailsModal(order)}>
                        <Eye className="h-4 w-4" />
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
            <DialogTitle>Detalhes do Pedido #{selectedOrder?.external_reference}</DialogTitle>
            <DialogDescription>
              Informações detalhadas sobre o pedido e seu status.
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ID do Pedido</p>
                  <p className="font-medium">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Referência Externa</p>
                  <p className="font-medium">{selectedOrder.external_reference}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-medium">{apiService.formatPrice(selectedOrder.total_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status do Pedido</p>
                  <Badge variant={getStatusBadgeVariant(selectedOrder.status)}>{selectedOrder.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status do Pagamento</p>
                  <Badge variant={getStatusBadgeVariant(selectedOrder.payment_status)}>{selectedOrder.payment_status || 'N/A'}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ID do Pagamento</p>
                  <p className="font-medium break-all">{selectedOrder.payment_id || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">E-mail do Cliente</p>
                  <p className="font-medium">{selectedOrder.customer_email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone do Cliente</p>
                  <p className="font-medium">{selectedOrder.customer_phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Liberação ESP Enviada</p>
                  <p className="font-medium">{selectedOrder.unlock_sent ? 'Sim' : 'Não'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Liberação ESP Sucesso</p>
                  <p className="font-medium">{selectedOrder.unlock_success ? 'Sim' : 'Não'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Criado em</p>
                  <p className="font-medium">{apiService.formatDate(selectedOrder.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Última Atualização</p>
                  <p className="font-medium">{apiService.formatDate(selectedOrder.updated_at)}</p>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="font-semibold mb-2">Itens do Pedido:</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">Qtd: {item.quantity} x {apiService.formatPrice(item.unit_price)}</p>
                      </div>
                      <p className="font-semibold">{apiService.formatPrice(item.total_price)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsModalOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminOrdersPage;
