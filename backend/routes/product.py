from flask import Blueprint, request, jsonify
from database import db
from models.product import Product

product_bp = Blueprint('product', __name__)

@product_bp.route('/products', methods=['GET'])
def get_products():
    """Retorna todos os produtos disponíveis."""
    try:
        # Parâmetros de filtro opcionais
        category = request.args.get('category')
        search = request.args.get('search')
        available_only = request.args.get('available_only', 'true').lower() == 'true'
        
        query = Product.query
        
        if available_only:
            query = query.filter(Product.active == True, Product.stock > 0)
        
        if category:
            query = query.filter(Product.category == category)
        
        if search:
            query = query.filter(
                db.or_(
                    Product.name.contains(search),
                    Product.description.contains(search)
                )
            )
        
        products = query.all()
        return jsonify([product.to_dict() for product in products])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@product_bp.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Retorna um produto específico."""
    try:
        product = Product.query.get_or_404(product_id)
        return jsonify(product.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@product_bp.route('/products/categories', methods=['GET'])
def get_categories():
    """Retorna todas as categorias de produtos."""
    try:
        categories = db.session.query(Product.category).filter(
            Product.category.isnot(None),
            Product.active == True
        ).distinct().all()
        
        category_list = [cat[0] for cat in categories if cat[0]]
        return jsonify(category_list)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@product_bp.route('/products', methods=['POST'])
def create_product():
    """Cria um novo produto (rota administrativa)."""
    try:
        data = request.get_json()
        
        # Validação básica
        required_fields = ['name', 'price']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Criar produto
        product = Product(
            name=data['name'],
            description=data.get('description', ''),
            price=float(data['price']),
            stock=int(data.get('stock', 0)),
            category=data.get('category', ''),
            image_url=data.get('image_url', ''),
            active=data.get('active', True)
        )
        
        db.session.add(product)
        db.session.commit()
        
        return jsonify(product.to_dict()), 201
        
    except ValueError as e:
        return jsonify({'error': 'Dados inválidos'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@product_bp.route('/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    """Atualiza um produto (rota administrativa)."""
    try:
        product = Product.query.get_or_404(product_id)
        data = request.get_json()
        
        # Atualizar campos
        if 'name' in data:
            product.name = data['name']
        if 'description' in data:
            product.description = data['description']
        if 'price' in data:
            product.price = float(data['price'])
        if 'stock' in data:
            product.stock = int(data['stock'])
        if 'category' in data:
            product.category = data['category']
        if 'image_url' in data:
            product.image_url = data['image_url']
        if 'active' in data:
            product.active = data['active']
        
        db.session.commit()
        return jsonify(product.to_dict())
        
    except ValueError as e:
        return jsonify({'error': 'Dados inválidos'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@product_bp.route('/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    """Deleta um produto (rota administrativa)."""
    try:
        product = Product.query.get_or_404(product_id)
        
        # Soft delete - apenas desativa o produto
        product.active = False
        db.session.commit()
        
        return jsonify({'message': 'Produto desativado com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@product_bp.route('/products/<int:product_id>/stock', methods=['POST'])
def update_stock(product_id):
    """Atualiza o estoque de um produto."""
    try:
        product = Product.query.get_or_404(product_id)
        data = request.get_json()
        
        if 'quantity' not in data:
            return jsonify({'error': 'Quantidade é obrigatória'}), 400
        
        action = data.get('action', 'set')  # set, add, subtract
        quantity = int(data['quantity'])
        
        if action == 'set':
            product.stock = quantity
        elif action == 'add':
            product.stock += quantity
        elif action == 'subtract':
            if product.stock >= quantity:
                product.stock -= quantity
            else:
                return jsonify({'error': 'Estoque insuficiente'}), 400
        else:
            return jsonify({'error': 'Ação inválida'}), 400
        
        db.session.commit()
        return jsonify(product.to_dict())
        
    except ValueError as e:
        return jsonify({'error': 'Quantidade inválida'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@product_bp.route('/products/check-availability', methods=['POST'])
def check_availability():
    """Verifica a disponibilidade de produtos para um carrinho."""
    try:
        data = request.get_json()
        items = data.get('items', [])
        
        availability = []
        
        for item in items:
            product_id = item.get('product_id')
            quantity = item.get('quantity', 1)
            
            product = Product.query.get(product_id)
            
            if not product:
                availability.append({
                    'product_id': product_id,
                    'available': False,
                    'reason': 'Produto não encontrado'
                })
            elif not product.active:
                availability.append({
                    'product_id': product_id,
                    'available': False,
                    'reason': 'Produto não está ativo'
                })
            elif product.stock < quantity:
                availability.append({
                    'product_id': product_id,
                    'available': False,
                    'reason': f'Estoque insuficiente. Disponível: {product.stock}'
                })
            else:
                availability.append({
                    'product_id': product_id,
                    'available': True,
                    'stock': product.stock
                })
        
        return jsonify({'availability': availability})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
