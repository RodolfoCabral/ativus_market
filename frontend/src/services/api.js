// Configuração da API
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin 
  : 'http://localhost:5000';

class ApiService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api`;
    this.token = localStorage.getItem('admin_token');
  }

  // Configurar headers padrão
  getHeaders(includeAuth = false) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Método genérico para fazer requisições
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(options.auth),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // === PRODUTOS ===
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/products${queryString ? `?${queryString}` : ''}`);
  }

  async getProduct(id) {
    return this.request(`/products/${id}`);
  }

  async getCategories() {
    return this.request('/products/categories');
  }

  async createProduct(productData) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
      auth: true,
    });
  }

  async updateProduct(id, productData) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
      auth: true,
    });
  }

  async deleteProduct(id) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
      auth: true,
    });
  }

  async updateStock(id, stockData) {
    return this.request(`/products/${id}/stock`, {
      method: 'POST',
      body: JSON.stringify(stockData),
      auth: true,
    });
  }

  async checkAvailability(items) {
    return this.request('/products/check-availability', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  }

  // === PEDIDOS ===
  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrder(id) {
    return this.request(`/orders/${id}`);
  }

  async getOrderByReference(reference) {
    return this.request(`/orders/reference/${reference}`);
  }

  async getOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/orders${queryString ? `?${queryString}` : ''}`, {
      auth: true,
    });
  }

  async updateOrderStatus(id, status) {
    return this.request(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
      auth: true,
    });
  }

  async getOrderStats() {
    return this.request('/orders/stats', { auth: true });
  }

  // === MERCADO PAGO ===
  async createPayment(orderData) {
    return this.request('/create-payment', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getPaymentInfo(paymentId) {
    return this.request(`/payment/${paymentId}`);
  }

  async testEsp() {
    return this.request('/test-esp', {
      method: 'POST',
      auth: true,
    });
  }

  async manualUnlock(duration = 60) {
    return this.request('/unlock-manual', {
      method: 'POST',
      body: JSON.stringify({ duration }),
      auth: true,
    });
  }

  async getEspStatus() {
    return this.request('/esp-status', { auth: true });
  }

  async getSystemStatus() {
    return this.request('/system-status');
  }

  // === ADMIN ===
  async adminLogin(credentials) {
    const response = await this.request('/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success) {
      this.token = response.token;
      localStorage.setItem('admin_token', response.token);
    }

    return response;
  }

  adminLogout() {
    this.token = null;
    localStorage.removeItem('admin_token');
  }

  async getDashboardStats() {
    return this.request('/admin/dashboard', { auth: true });
  }

  async getSalesReport(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/admin/sales-report${queryString ? `?${queryString}` : ''}`, {
      auth: true,
    });
  }

  async getAllProducts() {
    return this.request('/admin/products', { auth: true });
  }

  async getAllOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/admin/orders${queryString ? `?${queryString}` : ''}`, {
      auth: true,
    });
  }

  async getAllTransactions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/admin/transactions${queryString ? `?${queryString}` : ''}`, {
      auth: true,
    });
  }

  async bulkUpdateProducts(updates) {
    return this.request('/admin/products/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ updates }),
      auth: true,
    });
  }

  // === UTILITÁRIOS ===
  isAuthenticated() {
    return !!this.token;
  }

  formatPrice(price) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  }

  formatDate(date) {
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }
}

// Instância singleton
const apiService = new ApiService();

export default apiService;
