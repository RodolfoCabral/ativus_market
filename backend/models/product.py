from datetime import datetime
from database import db

class Product(db.Model):
    """Modelo para produtos da geladeira inteligente."""
    
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    stock = db.Column(db.Integer, default=0)
    category = db.Column(db.String(50))
    image_url = db.Column(db.String(200))
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    order_items = db.relationship('OrderItem', backref='product', lazy=True)
    
    def __repr__(self):
        return f'<Product {self.name}>'
    
    def to_dict(self):
        """Converte o produto para dicionário."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'stock': self.stock,
            'category': self.category,
            'image_url': self.image_url,
            'active': self.active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def is_available(self, quantity=1):
        """Verifica se o produto está disponível em estoque."""
        return self.active and self.stock >= quantity
    
    def reduce_stock(self, quantity):
        """Reduz o estoque do produto."""
        if self.stock >= quantity:
            self.stock -= quantity
            return True
        return False
    
    def increase_stock(self, quantity):
        """Aumenta o estoque do produto."""
        self.stock += quantity
    
    @classmethod
    def get_available_products(cls):
        """Retorna todos os produtos disponíveis (ativos e com estoque)."""
        return cls.query.filter(cls.active == True, cls.stock > 0).all()
    
    @classmethod
    def get_by_category(cls, category):
        """Retorna produtos por categoria."""
        return cls.query.filter(cls.category == category, cls.active == True).all()
    
    @classmethod
    def search_products(cls, search_term):
        """Busca produtos por nome ou descrição."""
        return cls.query.filter(
            db.or_(
                cls.name.contains(search_term),
                cls.description.contains(search_term)
            ),
            cls.active == True
        ).all()
