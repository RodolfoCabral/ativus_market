import os
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from backend.config import config
from backend.database import init_db
from backend.models.product import Product
from backend.database import db




def create_app(config_name=None):
    """Factory function para criar o aplicativo Flask."""
    
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'default')
    
    import os

    app = Flask(
        __name__,
        static_folder=os.path.join(os.path.dirname(__file__), '../frontend/dist'),
        static_url_path=''
    )


    #app = Flask(__name__, static_folder='static')
    app.config.from_object(config[config_name])
    
    # Habilitar CORS
    CORS(app, origins=['*'])
    
    # Inicializar banco de dados
    init_db(app)
    
    # Registrar blueprints
    from backend.routes.product import product_bp
    from backend.routes.order import order_bp
    from backend.routes.mercadopago import mercadopago_bp
    from backend.routes.admin import admin_bp
    
    app.register_blueprint(product_bp, url_prefix='/api')
    app.register_blueprint(order_bp, url_prefix='/api')
    app.register_blueprint(mercadopago_bp, url_prefix='/api')
    app.register_blueprint(admin_bp, url_prefix='/api')
    
    # Rota para servir arquivos estáticos do frontend
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        """Serve os arquivos compilados do frontend (Vite build)."""
        static_folder = app.static_folder
        file_path = os.path.join(static_folder, path)

        # Se o arquivo existir (como /assets/index-xxx.css ou /assets/index-xxx.js), sirva diretamente
        if path and os.path.exists(file_path):
            return send_from_directory(static_folder, path)

        # Caso contrário, devolve o index.html
        return send_from_directory(static_folder, 'index.html')



    
    # Handler de erro global
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Endpoint não encontrado'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Erro interno do servidor'}), 500
    
    # Rota de health check
    @app.route('/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'geladeira-inteligente-api'
        })
    
    return app

# Criar instância do app para uso direto
app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)
