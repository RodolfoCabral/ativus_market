import React from 'react';
import { Package } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-muted border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Package className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-foreground">
              Geladeira Inteligente
            </span>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-sm text-muted-foreground">
              © 2025 Geladeira Inteligente. Todos os direitos reservados.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Sistema de vending machine inteligente
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
