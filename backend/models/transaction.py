from datetime import datetime
from backend.database import db


class Transaction(db.Model):
    """Modelo para registrar transações e logs do sistema."""
    
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=True)
    payment_id = db.Column(db.String(100))
    external_reference = db.Column(db.String(100))
    payment_status = db.Column(db.String(20))  # approved, rejected, pending, cancelled
    lock_status = db.Column(db.String(20))     # locked, unlocked, unlock_failed
    amount = db.Column(db.Float)
    esp_response = db.Column(db.Text)  # Resposta do ESP8266
    error_message = db.Column(db.Text)
    extra_data = db.Column(db.JSON)  # Dados adicionais em JSON
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Transaction {self.payment_id}>'
    
    def to_dict(self):
        """Converte a transação para dicionário."""
        return {
            'id': self.id,
            'order_id': self.order_id,
            'payment_id': self.payment_id,
            'external_reference': self.external_reference,
            'payment_status': self.payment_status,
            'lock_status': self.lock_status,
            'amount': self.amount,
            'esp_response': self.esp_response,
            'error_message': self.error_message,
            'extra_data': self.extra_data,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @classmethod
    def log_payment(cls, payment_info, order=None):
        """Registra uma transação de pagamento."""
        transaction = cls(
            order_id=order.id if order else None,
            payment_id=payment_info.get('id'),
            external_reference=payment_info.get('external_reference'),
            payment_status=payment_info.get('status'),
            amount=payment_info.get('transaction_amount'),
            extra_data=payment_info
        )
        
        db.session.add(transaction)
        return transaction
    
    @classmethod
    def log_esp_response(cls, order, esp_response, success=False, error_message=None):
        """Registra a resposta do ESP8266."""
        transaction = cls(
            order_id=order.id if order else None,
            external_reference=order.external_reference if order else None,
            lock_status='unlocked' if success else 'unlock_failed',
            esp_response=str(esp_response),
            error_message=error_message
        )
        
        db.session.add(transaction)
        return transaction
    
    @classmethod
    def get_monthly_stats(cls, year, month):
        """Obtém estatísticas mensais de transações."""
        from sqlalchemy import func, extract
        
        # Transações aprovadas no mês
        approved_transactions = cls.query.filter(
            cls.payment_status == 'approved',
            extract('year', cls.created_at) == year,
            extract('month', cls.created_at) == month
        ).all()
        
        # Calcular estatísticas
        total_sales = sum(t.amount for t in approved_transactions if t.amount)
        total_transactions = len(approved_transactions)
        
        # Agrupar por dia
        daily_sales = db.session.query(
            func.date(cls.created_at).label('date'),
            func.sum(cls.amount).label('total'),
            func.count(cls.id).label('count')
        ).filter(
            cls.payment_status == 'approved',
            extract('year', cls.created_at) == year,
            extract('month', cls.created_at) == month
        ).group_by(func.date(cls.created_at)).all()
        
        return {
            'total_sales': total_sales or 0,
            'total_transactions': total_transactions,
            'daily_sales': [
                {
                    'date': day.date.isoformat(),
                    'total': float(day.total or 0),
                    'count': day.count
                }
                for day in daily_sales
            ]
        }
    
    @classmethod
    def get_product_sales_stats(cls, year, month):
        """Obtém estatísticas de vendas por produto no mês."""
        from sqlalchemy import func, extract
        from backend.models.order import OrderItem
        from backend.models.product import Product
        
        # Juntar transações aprovadas com itens de pedido
        product_stats = db.session.query(
            Product.name,
            Product.category,
            func.sum(OrderItem.quantity).label('total_quantity'),
            func.sum(OrderItem.quantity * OrderItem.unit_price).label('total_revenue')
        ).join(
            OrderItem, OrderItem.product_id == Product.id
        ).join(
            cls, cls.order_id == OrderItem.order_id
        ).filter(
            cls.payment_status == 'approved',
            extract('year', cls.created_at) == year,
            extract('month', cls.created_at) == month
        ).group_by(Product.id, Product.name, Product.category).all()
        
        return [
            {
                'product_name': stat.name,
                'category': stat.category,
                'total_quantity': int(stat.total_quantity or 0),
                'total_revenue': float(stat.total_revenue or 0)
            }
            for stat in product_stats
        ]
