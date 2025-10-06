import os
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from backend.database import init_db
from backend.models.product import Product
from backend.database import db

def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'default')

    app = Flask(__name__, static_folder='../frontend', static_url_path='/')
    CORS(app, origins=['*'])
    init_db(app)

    @app.route('/')
    def index():
        return send_from_directory(app.static_folder, 'index.html')

    @app.route('/<path:filename>')
    def serve_static(filename):
        return send_from_directory(app.static_folder, filename)

    @app.route('/health')
    def health():
        return jsonify({'status': 'ok', 'service': 'Ativus Market'})

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
