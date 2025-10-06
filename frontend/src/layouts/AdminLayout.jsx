import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Package, ShoppingCart, BarChart, Settings, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import apiService from '../services/api';
import { Toaster } from '@/components/ui/toaster';

function AdminLayout() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    apiService.logout();
    toast({
      title: 'Logout realizado',
      description: 'Você foi desconectado do painel administrativo.',
    });
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-muted/40">
      {/* Sidebar */}
      <Card className="lg:w-64 p-4 lg:p-6 border-r lg:min-h-screen flex flex-col">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-primary">Admin Panel</h2>
          <p className="text-sm text-muted-foreground">Geladeira Inteligente</p>
        </div>
        
        <nav className="flex-1 space-y-2">
          <Link to="/admin/dashboard">
            <Button variant="ghost" className="w-full justify-start">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <Link to="/admin/products">
            <Button variant="ghost" className="w-full justify-start">
              <Package className="h-4 w-4 mr-2" />
              Produtos
            </Button>
          </Link>
          <Link to="/admin/orders">
            <Button variant="ghost" className="w-full justify-start">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Pedidos
            </Button>
          </Link>
          <Link to="/admin/reports">
            <Button variant="ghost" className="w-full justify-start">
              <BarChart className="h-4 w-4 mr-2" />
              Relatórios
            </Button>
          </Link>
          {/* <Link to="/admin/settings">
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
          </Link> */}
        </nav>

        <Separator className="my-6" />

        <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </Card>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 overflow-auto">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}

export default AdminLayout;
