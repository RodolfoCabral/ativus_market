import os
from datetime import timedelta

class Config:
    """Configurações base do aplicativo Flask."""
    
    # Configurações básicas do Flask
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///geladeira.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Configurações do Mercado Pago
    MERCADOPAGO_ACCESS_TOKEN = os.environ.get('MERCADOPAGO_ACCESS_TOKEN', 'TEST-YOUR-ACCESS-TOKEN')
    MERCADOPAGO_PUBLIC_KEY = os.environ.get('MERCADOPAGO_PUBLIC_KEY', 'TEST-YOUR-PUBLIC-KEY')
    WEBHOOK_SECRET = os.environ.get('WEBHOOK_SECRET', 'your-webhook-secret')
    MERCADOPAGO_API_BASE = 'https://api.mercadopago.com'
    
    # Configurações do ESP8266
    ESP8266_IP = os.environ.get('ESP8266_IP', '192.168.1.100')
    ESP8266_PORT = os.environ.get('ESP8266_PORT', '80')
    ESP8266_TIMEOUT = int(os.environ.get('ESP8266_TIMEOUT', '10'))
    
    # Configurações do servidor
    PORT = int(os.environ.get('PORT', 5000))
    FLASK_ENV = os.environ.get('FLASK_ENV', 'production')
    DEBUG = FLASK_ENV == 'development'
    
    # Configurações de autenticação (simples para admin)
    ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
    ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    # Configurações de upload de arquivos
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

class DevelopmentConfig(Config):
    """Configurações para ambiente de desenvolvimento."""
    DEBUG = True
    FLASK_ENV = 'development'

class ProductionConfig(Config):
    """Configurações para ambiente de produção."""
    DEBUG = False
    FLASK_ENV = 'production'

# Mapeamento de configurações por ambiente
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
