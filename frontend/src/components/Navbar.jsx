import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Home, Package, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '../contexts/CartContext';
import apiService from '../services/api';

function Navbar() {
  const location = useLocation();
  const { getItemCount } = useCart();
  const itemCount = getItemCount();
  const isAdmin = apiService.isAuthenticated();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Package className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">
              Geladeira Inteligente
            </span>
          </Link>

          {/* Menu principal */}
          {!isAdminRoute && (
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/'
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <Home className="h-4 w-4" />
                <span>Início</span>
              </Link>
              
              <Link
                to="/produtos"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/produtos'
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <Package className="h-4 w-4" />
                <span>Produtos</span>
              </Link>
            </div>
          )}

          {/* Menu admin */}
          {isAdminRoute && isAdmin && (
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/admin/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/admin/dashboard' || location.pathname === '/admin'
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                Dashboard
              </Link>
              
              <Link
                to="/admin/produtos"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/admin/produtos'
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                Produtos
              </Link>
              
              <Link
                to="/admin/pedidos"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/admin/pedidos'
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                Pedidos
              </Link>
              
              <Link
                to="/admin/relatorios"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/admin/relatorios'
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                Relatórios
              </Link>
            </div>
          )}

          {/* Ações */}
          <div className="flex items-center space-x-4">
            {!isAdminRoute && (
              <Link to="/carrinho">
                <Button variant="outline" size="sm" className="relative">
                  <ShoppingCart className="h-4 w-4" />
                  {itemCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {itemCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}

            {isAdminRoute && isAdmin && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    apiService.adminLogout();
                    window.location.href = '/';
                  }}
                >
                  Sair
                </Button>
              </div>
            )}

            {!isAdminRoute && (
              <Link to="/admin/login">
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4 mr-1" />
                  Admin
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Menu mobile */}
        {!isAdminRoute && (
          <div className="md:hidden border-t border-border">
            <div className="flex justify-around py-2">
              <Link
                to="/"
                className={`flex flex-col items-center py-2 px-3 text-xs ${
                  location.pathname === '/'
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                <Home className="h-5 w-5" />
                <span>Início</span>
              </Link>
              
              <Link
                to="/produtos"
                className={`flex flex-col items-center py-2 px-3 text-xs ${
                  location.pathname === '/produtos'
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                <Package className="h-5 w-5" />
                <span>Produtos</span>
              </Link>
              
              <Link
                to="/carrinho"
                className={`flex flex-col items-center py-2 px-3 text-xs relative ${
                  location.pathname === '/carrinho'
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                <ShoppingCart className="h-5 w-5" />
                <span>Carrinho</span>
                {itemCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs"
                  >
                    {itemCount}
                  </Badge>
                )}
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
