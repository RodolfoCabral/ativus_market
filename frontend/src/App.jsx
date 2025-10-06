import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import CartPage from './pages/CartPage';
import PaymentPage from './pages/PaymentPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentFailurePage from './pages/PaymentFailurePage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminProductsPage from './pages/AdminProductsPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminReportsPage from './pages/AdminReportsPage';
import { CartProvider } from './contexts/CartContext';

function App() {
  return (
    <Router>
      <CartProvider>
        <Routes>
          {/* Rotas do Cliente */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="produtos" element={<ProductsPage />} />
            <Route path="carrinho" element={<CartPage />} />
            <Route path="pagamento" element={<PaymentPage />} />
            <Route path="pagamento/sucesso" element={<PaymentSuccessPage />} />
            <Route path="pagamento/falha" element={<PaymentFailurePage />} />
            <Route path="pagamento/pending" element={<PaymentSuccessPage />} /> {/* Mercado Pago pode retornar pending também */}
          </Route>

          {/* Rotas Administrativas */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
          </Route>
        </Routes>
      </CartProvider>
    </Router>
  );
}

export default App;

