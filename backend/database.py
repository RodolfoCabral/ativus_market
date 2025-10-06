from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os

db = SQLAlchemy()
migrate = Migrate()

def init_db(app):
    # Ler variável do ambiente
    DATABASE_URL = os.environ.get('DATABASE_URL')
    if not DATABASE_URL:
        print("❌ Erro: DATABASE_URL não encontrada nas variáveis de ambiente")
        sys.exit(1)

    # Corrigir prefixo do PostgreSQL (Heroku usa formato antigo)
    if DATABASE_URL.startswith('postgres://'):
        DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

def _insert_initial_data():
    """Insere dados iniciais no banco de dados se não existirem."""
    from models.product import Product
    
    # Verificar se já existem produtos
    if Product.query.count() == 0:
        # Produtos iniciais para a geladeira
        initial_products = [
            {
                'name': 'Água Mineral 500ml',
                'description': 'Água mineral natural sem gás',
                'price': 2.50,
                'stock': 20,
                'category': 'Bebidas',
                'image_url': '/static/images/agua.jpg',
                'active': True
            },
            {
                'name': 'Coca-Cola 350ml',
                'description': 'Refrigerante Coca-Cola tradicional',
                'price': 4.50,
                'stock': 15,
                'category': 'Bebidas',
                'image_url': '/static/images/coca-normal.jpg',
                'active': True
            },
            {
                'name': 'Coca-Cola Zero 350ml',
                'description': 'Refrigerante Coca-Cola Zero açúcar',
                'price': 4.50,
                'stock': 15,
                'category': 'Bebidas',
                'image_url': '/static/images/coca-zero.jpg',
                'active': True
            },
            {
                'name': 'Sanduíche Natural',
                'description': 'Sanduíche natural de frango com salada',
                'price': 8.00,
                'stock': 10,
                'category': 'Lanches',
                'image_url': '/static/images/sanduiche.jpg',
                'active': True
            },
            {
                'name': 'Bolo de Pote - Chocolate',
                'description': 'Delicioso bolo de chocolate no pote',
                'price': 6.00,
                'stock': 12,
                'category': 'Doces',
                'image_url': '/static/images/bolo-chocolate.jpg',
                'active': True
            },
            {
                'name': 'Bolo de Pote - Morango',
                'description': 'Delicioso bolo de morango no pote',
                'price': 6.00,
                'stock': 12,
                'category': 'Doces',
                'image_url': '/static/images/bolo-morango.jpg',
                'active': True
            },
            {
                'name': 'Cerveja Heineken 350ml',
                'description': 'Cerveja Heineken gelada',
                'price': 7.50,
                'stock': 8,
                'category': 'Bebidas Alcoólicas',
                'image_url': '/static/images/cerveja.jpg',
                'active': True
            }
        ]
        
        for product_data in initial_products:
            product = Product(**product_data)
            db.session.add(product)
        
        try:
            db.session.commit()
            print("Dados iniciais inseridos com sucesso!")
        except Exception as e:
            db.session.rollback()
            print(f"Erro ao inserir dados iniciais: {e}")
