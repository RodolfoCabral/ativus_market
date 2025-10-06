from flask import Blueprint, request, jsonify, current_app
from functools import wraps
from backend.database import db
from models.product import Product
from models.order import Order
from models.transaction import Transaction
from datetime import datetime, timedelta
import jwt

admin_bp = Blueprint('admin', __name__)

def admin_required(f):
    """Decorator para verificar autenticação de admin."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token de acesso requerido'}), 401
        
        try:
            # Remover 'Bearer ' do token
            if token.startswith('Bearer '):
                token = token[7:]
            
            # Decodificar token JWT
            payload = jwt.decode(
                token, 
                current_app.config['JWT_SECRET_KEY'], 
                algorithms=['HS256']
            )
            
            # Verificar se é admin
            if not payload.get('is_admin'):
                return jsonify({'error': 'Acesso negado'}), 403
                
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token inválido'}), 401
        
        return f(*args, **kwargs)
    
    return decorated_function

@admin_bp.route('/admin/login', methods=['POST'])
def admin_login():
    """Login do administrador."""
    try:
        data = request.get_json()
        
        username = data.get('username')
        password = data.get('password')
        
        # Verificar credenciais
        if (username == current_app.config['ADMIN_USERNAME'] and 
            password == current_app.config['ADMIN_PASSWORD']):
            
            # Gerar token JWT
            payload = {
                'username': username,
                'is_admin': True,
                'exp': datetime.utcnow() + current_app.config['JWT_ACCESS_TOKEN_EXPIRES']
            }
            
            token = jwt.encode(
                payload, 
                current_app.config['JWT_SECRET_KEY'], 
                algorithm='HS256'
            )
            
            return jsonify({
                'success': True,
                'token': token,
                'expires_in': current_app.config['JWT_ACCESS_TOKEN_EXPIRES'].total_seconds()
            })
        else:
            return jsonify({'error': 'Credenciais inválidas'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/dashboard', methods=['GET'])
@admin_required
def get_dashboard_stats():
    """Retorna estatísticas para o dashboard administrativo."""
    try:
        from sqlalchemy import func
        
        # Estatísticas gerais
        total_products = Product.query.count()
        active_products = Product.query.filter(Product.active == True).count()
        total_orders = Order.query.count()
        paid_orders = Order.query.filter(Order.status == 'paid').count()
        
        # Vendas do mês atual
        now = datetime.now()
        start_of_month = datetime(now.year, now.month, 1)
        
        monthly_sales = db.session.query(
            func.sum(Order.total_amount)
        ).filter(
            Order.status == 'paid',
            Order.created_at >= start_of_month
        ).scalar() or 0
        
        monthly_orders = Order.query.filter(
            Order.status == 'paid',
            Order.created_at >= start_of_month
        ).count()
        
        # Vendas dos últimos 7 dias
        week_ago = now - timedelta(days=7)
        weekly_sales = db.session.query(
            func.sum(Order.total_amount)
        ).filter(
            Order.status == 'paid',
            Order.created_at >= week_ago
        ).scalar() or 0
        
        # Produtos com baixo estoque (menos de 5 unidades)
        low_stock_products = Product.query.filter(
            Product.active == True,
            Product.stock < 5
        ).all()
        
        # Últimas transações
        recent_transactions = Transaction.query.filter(
            Transaction.payment_status == 'approved'
        ).order_by(Transaction.created_at.desc()).limit(10).all()
        
        return jsonify({
            'stats': {
                'total_products': total_products,
                'active_products': active_products,
                'total_orders': total_orders,
                'paid_orders': paid_orders,
                'monthly_sales': float(monthly_sales),
                'monthly_orders': monthly_orders,
                'weekly_sales': float(weekly_sales)
            },
            'low_stock_products': [product.to_dict() for product in low_stock_products],
            'recent_transactions': [transaction.to_dict() for transaction in recent_transactions]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/sales-report', methods=['GET'])
@admin_required
def get_sales_report():
    """Gera relatório de vendas."""
    try:
        # Parâmetros de filtro
        year = int(request.args.get('year', datetime.now().year))
        month = int(request.args.get('month', datetime.now().month))
        
        # Estatísticas mensais
        monthly_stats = Transaction.get_monthly_stats(year, month)
        
        # Estatísticas por produto
        product_stats = Transaction.get_product_sales_stats(year, month)
        
        # Vendas por categoria
        from sqlalchemy import func
        category_stats = db.session.query(
            Product.category,
            func.sum(OrderItem.quantity * OrderItem.unit_price).label('total_revenue'),
            func.sum(OrderItem.quantity).label('total_quantity')
        ).join(
            OrderItem, OrderItem.product_id == Product.id
        ).join(
            Transaction, Transaction.order_id == OrderItem.order_id
        ).filter(
            Transaction.payment_status == 'approved',
            func.extract('year', Transaction.created_at) == year,
            func.extract('month', Transaction.created_at) == month
        ).group_by(Product.category).all()
        
        return jsonify({
            'period': {
                'year': year,
                'month': month
            },
            'monthly_stats': monthly_stats,
            'product_stats': product_stats,
            'category_stats': [
                {
                    'category': stat.category,
                    'total_revenue': float(stat.total_revenue or 0),
                    'total_quantity': int(stat.total_quantity or 0)
                }
                for stat in category_stats
            ]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/products', methods=['GET'])
@admin_required
def get_all_products():
    """Retorna todos os produtos (incluindo inativos)."""
    try:
        products = Product.query.order_by(Product.created_at.desc()).all()
        return jsonify([product.to_dict() for product in products])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/orders', methods=['GET'])
@admin_required
def get_all_orders():
    """Retorna todos os pedidos."""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 50))
        status = request.args.get('status')
        
        query = Order.query
        
        if status:
            query = query.filter(Order.status == status)
        
        orders = query.order_by(Order.created_at.desc()).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        return jsonify({
            'orders': [order.to_dict() for order in orders.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': orders.total,
                'pages': orders.pages,
                'has_next': orders.has_next,
                'has_prev': orders.has_prev
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/transactions', methods=['GET'])
@admin_required
def get_all_transactions():
    """Retorna todas as transações."""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 50))
        
        transactions = Transaction.query.order_by(Transaction.created_at.desc()).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        return jsonify({
            'transactions': [transaction.to_dict() for transaction in transactions.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': transactions.total,
                'pages': transactions.pages,
                'has_next': transactions.has_next,
                'has_prev': transactions.has_prev
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/products/bulk-update', methods=['POST'])
@admin_required
def bulk_update_products():
    """Atualização em lote de produtos."""
    try:
        data = request.get_json()
        updates = data.get('updates', [])
        
        for update in updates:
            product_id = update.get('id')
            product = Product.query.get(product_id)
            
            if product:
                if 'stock' in update:
                    product.stock = int(update['stock'])
                if 'price' in update:
                    product.price = float(update['price'])
                if 'active' in update:
                    product.active = update['active']
        
        db.session.commit()
        
        return jsonify({'message': 'Produtos atualizados com sucesso'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
