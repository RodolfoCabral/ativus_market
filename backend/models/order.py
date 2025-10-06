from datetime import datetime
from backend.database import db


class Order(db.Model):
    """Modelo para pedidos da geladeira inteligente."""
    
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    external_reference = db.Column(db.String(100), unique=True, nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, paid, cancelled, failed
    payment_id = db.Column(db.String(100))
    payment_status = db.Column(db.String(20))
    customer_email = db.Column(db.String(100))
    customer_phone = db.Column(db.String(20))
    unlock_sent = db.Column(db.Boolean, default=False)
    unlock_success = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')
    transactions = db.relationship('Transaction', backref='order', lazy=True)
    
    def __repr__(self):
        return f'<Order {self.external_reference}>'
    
    def to_dict(self):
        """Converte o pedido para dicionário."""
        return {
            'id': self.id,
            'external_reference': self.external_reference,
            'total_amount': self.total_amount,
            'status': self.status,
            'payment_id': self.payment_id,
            'payment_status': self.payment_status,
            'customer_email': self.customer_email,
            'customer_phone': self.customer_phone,
            'unlock_sent': self.unlock_sent,
            'unlock_success': self.unlock_success,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'items': [item.to_dict() for item in self.items]
        }
    
    def calculate_total(self):
        """Calcula o total do pedido baseado nos itens."""
        total = sum(item.quantity * item.unit_price for item in self.items)
        self.total_amount = total
        return total
    
    def add_item(self, product, quantity):
        """Adiciona um item ao pedido."""
        # Verificar se o produto já existe no pedido
        existing_item = OrderItem.query.filter_by(
            order_id=self.id, 
            product_id=product.id
        ).first()
        
        if existing_item:
            existing_item.quantity += quantity
        else:
            item = OrderItem(
                order=self,
                product=product,
                quantity=quantity,
                unit_price=product.price
            )
            db.session.add(item)
        
        self.calculate_total()
    
    @classmethod
    def create_from_cart(cls, cart_items, customer_email=None, customer_phone=None):
        """Cria um pedido a partir de itens do carrinho."""
        # Gerar referência externa única
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        external_reference = f'geladeira_{timestamp}_{cls.query.count() + 1}'
        
        order = cls(
            external_reference=external_reference,
            customer_email=customer_email,
            customer_phone=customer_phone
        )
        
        db.session.add(order)
        db.session.flush()  # Para obter o ID do pedido
        
        # Adicionar itens ao pedido
        for item in cart_items:
            product_id = item.get('product_id')
            quantity = item.get('quantity', 1)
            
            from models.product import Product
            product = Product.query.get(product_id)
            
            if product and product.is_available(quantity):
                order.add_item(product, quantity)
            else:
                raise ValueError(f'Produto {product_id} não disponível em quantidade suficiente')
        
        order.calculate_total()
        return order

class OrderItem(db.Model):
    """Modelo para itens de pedido."""
    
    __tablename__ = 'order_items'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<OrderItem {self.product.name} x{self.quantity}>'
    
    def to_dict(self):
        """Converte o item do pedido para dicionário."""
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'quantity': self.quantity,
            'unit_price': self.unit_price,
            'total_price': self.quantity * self.unit_price,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @property
    def total_price(self):
        """Calcula o preço total do item."""
        return self.quantity * self.unit_price
