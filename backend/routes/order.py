from flask import Blueprint, request, jsonify
from backend.database import db
from models.order import Order, OrderItem
from models.product import Product

order_bp = Blueprint('order', __name__)

@order_bp.route('/orders', methods=['POST'])
def create_order():
    """Cria um novo pedido a partir do carrinho."""
    try:
        data = request.get_json()
        
        # Validação básica
        if 'items' not in data or not data['items']:
            return jsonify({'error': 'Itens do carrinho são obrigatórios'}), 400
        
        # Validar disponibilidade dos produtos
        cart_items = data['items']
        for item in cart_items:
            product_id = item.get('product_id')
            quantity = item.get('quantity', 1)
            
            product = Product.query.get(product_id)
            if not product:
                return jsonify({'error': f'Produto {product_id} não encontrado'}), 400
            
            if not product.is_available(quantity):
                return jsonify({
                    'error': f'Produto {product.name} não disponível em quantidade suficiente'
                }), 400
        
        # Criar pedido
        order = Order.create_from_cart(
            cart_items,
            customer_email=data.get('customer_email'),
            customer_phone=data.get('customer_phone')
        )
        
        db.session.commit()
        
        return jsonify(order.to_dict()), 201
        
    except ValueError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@order_bp.route('/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    """Retorna um pedido específico."""
    try:
        order = Order.query.get_or_404(order_id)
        return jsonify(order.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@order_bp.route('/orders/reference/<external_reference>', methods=['GET'])
def get_order_by_reference(external_reference):
    """Retorna um pedido pela referência externa."""
    try:
        order = Order.query.filter_by(external_reference=external_reference).first_or_404()
        return jsonify(order.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@order_bp.route('/orders', methods=['GET'])
def get_orders():
    """Retorna lista de pedidos (rota administrativa)."""
    try:
        # Parâmetros de filtro
        status = request.args.get('status')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        query = Order.query
        
        if status:
            query = query.filter(Order.status == status)
        
        # Ordenar por data de criação (mais recentes primeiro)
        query = query.order_by(Order.created_at.desc())
        
        # Paginação
        orders = query.paginate(
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

@order_bp.route('/orders/<int:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    """Atualiza o status de um pedido."""
    try:
        order = Order.query.get_or_404(order_id)
        data = request.get_json()
        
        if 'status' not in data:
            return jsonify({'error': 'Status é obrigatório'}), 400
        
        new_status = data['status']
        valid_statuses = ['pending', 'paid', 'cancelled', 'failed']
        
        if new_status not in valid_statuses:
            return jsonify({'error': 'Status inválido'}), 400
        
        # Se o pedido está sendo cancelado, devolver produtos ao estoque
        if new_status == 'cancelled' and order.status != 'cancelled':
            for item in order.items:
                item.product.increase_stock(item.quantity)
        
        order.status = new_status
        db.session.commit()
        
        return jsonify(order.to_dict())
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@order_bp.route('/orders/<int:order_id>/confirm-payment', methods=['POST'])
def confirm_payment(order_id):
    """Confirma o pagamento de um pedido e reduz estoque."""
    try:
        order = Order.query.get_or_404(order_id)
        data = request.get_json()
        
        if order.status == 'paid':
            return jsonify({'error': 'Pedido já foi pago'}), 400
        
        # Verificar disponibilidade novamente
        for item in order.items:
            if not item.product.is_available(item.quantity):
                return jsonify({
                    'error': f'Produto {item.product.name} não está mais disponível'
                }), 400
        
        # Reduzir estoque
        for item in order.items:
            item.product.reduce_stock(item.quantity)
        
        # Atualizar status do pedido
        order.status = 'paid'
        order.payment_id = data.get('payment_id')
        order.payment_status = data.get('payment_status', 'approved')
        
        db.session.commit()
        
        return jsonify(order.to_dict())
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@order_bp.route('/orders/stats', methods=['GET'])
def get_order_stats():
    """Retorna estatísticas de pedidos."""
    try:
        from sqlalchemy import func
        from datetime import datetime, timedelta
        
        # Estatísticas gerais
        total_orders = Order.query.count()
        paid_orders = Order.query.filter(Order.status == 'paid').count()
        pending_orders = Order.query.filter(Order.status == 'pending').count()
        
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
        
        return jsonify({
            'total_orders': total_orders,
            'paid_orders': paid_orders,
            'pending_orders': pending_orders,
            'monthly_sales': float(monthly_sales),
            'monthly_orders': monthly_orders,
            'weekly_sales': float(weekly_sales)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
