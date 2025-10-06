from flask import Blueprint, request, jsonify, current_app
from backend.database import db
from backend.models.order import Order
from backend.models.transaction import Transaction
from backend.utils.mercadopago_utils import MercadoPagoService
from backend.utils.esp_utils import ESP8266Service

mercadopago_bp = Blueprint('mercadopago', __name__)

@mercadopago_bp.route('/create-payment', methods=['POST'])
def create_payment():
    """Cria uma preferência de pagamento no Mercado Pago."""
    try:
        data = request.get_json()
        
        # Validar dados
        if 'order_id' not in data:
            return jsonify({'error': 'ID do pedido é obrigatório'}), 400
        
        # Buscar pedido
        order = Order.query.get_or_404(data['order_id'])
        
        if order.status != 'pending':
            return jsonify({'error': 'Pedido não está pendente'}), 400
        
        # Criar preferência no Mercado Pago
        mp_service = MercadoPagoService()
        result = mp_service.create_payment_preference(order)
        
        if result['success']:
            return jsonify({
                'success': True,
                'preference_id': result['preference_id'],
                'init_point': result['init_point'],
                'sandbox_init_point': result.get('sandbox_init_point'),
                'public_key': result['public_key'],
                'order': order.to_dict()
            })
        else:
            current_app.logger.error(f"Erro ao criar preferência MP: {result}")
            return jsonify({
                'success': False,
                'error': result['error'],
                'details': result.get('details')
            }), 500
            
    except Exception as e:
        current_app.logger.error(f"Erro interno ao criar pagamento: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@mercadopago_bp.route('/webhook/mercadopago', methods=['POST'])
def webhook_mercadopago():
    """Webhook para receber notificações do Mercado Pago."""
    try:
        # Validar assinatura do webhook
        signature = request.headers.get('x-signature')
        mp_service = MercadoPagoService()
        
        if not mp_service.validate_webhook_signature(request.get_data(), signature):
            current_app.logger.warning("Assinatura de webhook inválida")
            return jsonify({'error': 'Assinatura inválida'}), 401
        
        # Processar notificação
        data = request.get_json()
        
        # Se não há dados no body, tentar obter dos query params
        if not data:
            payment_id = request.args.get('data.id')
            topic = request.args.get('type')
            
            if payment_id and topic == 'payment':
                data = {
                    'type': 'payment',
                    'data': {'id': payment_id}
                }
        
        if not data:
            return jsonify({'status': 'ok'}), 200
        
        # Processar webhook
        result = mp_service.process_webhook_notification(data)
        
        if result['success']:
            payment_info = result['payment_info']
            external_reference = result['external_reference']
            
            # Buscar pedido
            order = Order.query.filter_by(external_reference=external_reference).first()
            
            if order:
                # Registrar transação
                transaction = Transaction.log_payment(payment_info, order)
                
                # Processar pagamento baseado no status
                payment_status = result['status']
                
                if payment_status == 'approved':
                    # Pagamento aprovado - confirmar pedido e destravar geladeira
                    order.status = 'paid'
                    order.payment_id = result['payment_id']
                    order.payment_status = payment_status
                    
                    # Reduzir estoque
                    for item in order.items:
                        item.product.reduce_stock(item.quantity)
                    
                    # Enviar comando para ESP8266
                    esp_service = ESP8266Service()
                    esp_result = esp_service.send_unlock_command()
                    
                    # Registrar resultado do ESP
                    Transaction.log_esp_response(
                        order, 
                        esp_result.get('esp_response', ''),
                        esp_result['success'],
                        esp_result.get('error')
                    )
                    
                    order.unlock_sent = True
                    order.unlock_success = esp_result['success']
                    
                    current_app.logger.info(f"Pagamento aprovado para pedido {order.external_reference}")
                    
                elif payment_status == 'rejected':
                    order.status = 'failed'
                    order.payment_id = result['payment_id']
                    order.payment_status = payment_status
                    
                    current_app.logger.info(f"Pagamento rejeitado para pedido {order.external_reference}")
                    
                elif payment_status == 'pending':
                    order.payment_id = result['payment_id']
                    order.payment_status = payment_status
                    
                    current_app.logger.info(f"Pagamento pendente para pedido {order.external_reference}")
                
                db.session.commit()
            else:
                current_app.logger.warning(f"Pedido não encontrado: {external_reference}")
        
        return jsonify({'status': 'ok'}), 200
        
    except Exception as e:
        current_app.logger.error(f"Erro no webhook: {e}")
        return jsonify({'error': 'Erro interno'}), 500

@mercadopago_bp.route('/payment/<payment_id>', methods=['GET'])
def get_payment_info(payment_id):
    """Busca informações de um pagamento específico."""
    try:
        mp_service = MercadoPagoService()
        result = mp_service.get_payment_info(payment_id)
        
        if result['success']:
            return jsonify({
                'success': True,
                'payment': result['payment']
            })
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@mercadopago_bp.route('/test-esp', methods=['POST'])
def test_esp_connection():
    """Testa a conexão com o ESP8266."""
    try:
        esp_service = ESP8266Service()
        result = esp_service.test_connection()
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mercadopago_bp.route('/unlock-manual', methods=['POST'])
def manual_unlock():
    """Destrava a geladeira manualmente (para testes)."""
    try:
        data = request.get_json()
        duration = data.get('duration', 60)
        
        esp_service = ESP8266Service()
        result = esp_service.send_unlock_command(duration)
        
        # Registrar ação manual
        transaction = Transaction(
            external_reference='manual_unlock',
            lock_status='unlocked' if result['success'] else 'unlock_failed',
            esp_response=result.get('esp_response', ''),
            error_message=result.get('error')
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mercadopago_bp.route('/esp-status', methods=['GET'])
def get_esp_status():
    """Obtém o status atual do ESP8266."""
    try:
        esp_service = ESP8266Service()
        result = esp_service.get_status()
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mercadopago_bp.route('/system-status', methods=['GET'])
def get_system_status():
    """Retorna o status geral do sistema."""
    try:
        from datetime import datetime
        
        # Status do Mercado Pago
        mp_configured = current_app.config['MERCADOPAGO_ACCESS_TOKEN'] != 'TEST-YOUR-ACCESS-TOKEN'
        
        # Status do ESP8266
        esp_service = ESP8266Service()
        esp_configured = esp_service.is_configured()
        
        return jsonify({
            'status': 'online',
            'timestamp': datetime.utcnow().isoformat(),
            'mercadopago_configured': mp_configured,
            'esp8266_configured': esp_configured,
            'esp8266_ip': current_app.config['ESP8266_IP'],
            'database_connected': True  # Se chegou até aqui, DB está OK
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500
