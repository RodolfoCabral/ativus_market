import os
import json
import requests
import hashlib
import hmac
from flask import Blueprint, request, jsonify
from datetime import datetime

mercadopago_bp = Blueprint('mercadopago', __name__)

# Configurações do Mercado Pago (substitua pelas suas credenciais)
MERCADOPAGO_ACCESS_TOKEN = os.getenv('MERCADOPAGO_ACCESS_TOKEN', 'TEST-YOUR-ACCESS-TOKEN')
MERCADOPAGO_PUBLIC_KEY = os.getenv('MERCADOPAGO_PUBLIC_KEY', 'TEST-YOUR-PUBLIC-KEY')
WEBHOOK_SECRET = os.getenv('WEBHOOK_SECRET', 'your-webhook-secret')

# URL base da API do Mercado Pago
MERCADOPAGO_API_BASE = 'https://api.mercadopago.com'

@mercadopago_bp.route('/create-payment-preference', methods=['POST'])
def create_payment_preference():
    """
    Cria uma preferência de pagamento no Mercado Pago
    """
    try:
        data = request.get_json()
        
        # Validar dados recebidos
        if not data or 'items' not in data:
            return jsonify({'error': 'Items são obrigatórios'}), 400
        
        # Preparar dados para o Mercado Pago
        preference_data = {
            'items': data['items'],
            'back_urls': data.get('back_urls', {
                'success': request.host_url + 'success',
                'failure': request.host_url + 'failure',
                'pending': request.host_url + 'pending'
            }),
            'auto_return': data.get('auto_return', 'approved'),
            'notification_url': request.host_url + 'api/webhook/mercadopago',
            'external_reference': f'geladeira_{datetime.now().strftime("%Y%m%d_%H%M%S")}',
            'payment_methods': {
                'excluded_payment_types': [],
                'installments': 12
            },
            'shipments': {
                'mode': 'not_specified'
            }
        }
        
        # Fazer requisição para o Mercado Pago
        headers = {
            'Authorization': f'Bearer {MERCADOPAGO_ACCESS_TOKEN}',
            'Content-Type': 'application/json'
        }
        
        response = requests.post(
            f'{MERCADOPAGO_API_BASE}/checkout/preferences',
            headers=headers,
            json=preference_data
        )
        
        if response.status_code == 201:
            preference = response.json()
            return jsonify({
                'id': preference['id'],
                'init_point': preference['init_point'],
                'sandbox_init_point': preference['sandbox_init_point']
            })
        else:
            print(f"Erro do Mercado Pago: {response.status_code} - {response.text}")
            return jsonify({'error': 'Erro ao criar preferência de pagamento'}), 500
            
    except Exception as e:
        print(f"Erro interno: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@mercadopago_bp.route('/webhook/mercadopago', methods=['POST'])
def webhook_mercadopago():
    """
    Webhook para receber notificações do Mercado Pago
    """
    try:
        # Validar assinatura do webhook (opcional mas recomendado)
        signature = request.headers.get('x-signature')
        if signature and WEBHOOK_SECRET != 'your-webhook-secret':
            if not validate_webhook_signature(request.get_data(), signature):
                return jsonify({'error': 'Assinatura inválida'}), 401
        
        # Processar notificação
        data = request.get_json()
        
        if not data:
            # Tentar obter dados dos query params
            payment_id = request.args.get('data.id')
            topic = request.args.get('type')
            
            if payment_id and topic == 'payment':
                # Buscar informações do pagamento
                payment_info = get_payment_info(payment_id)
                if payment_info:
                    process_payment_notification(payment_info)
                    return jsonify({'status': 'ok'})
        else:
            # Processar dados do body
            if data.get('type') == 'payment' and data.get('data', {}).get('id'):
                payment_id = data['data']['id']
                payment_info = get_payment_info(payment_id)
                if payment_info:
                    process_payment_notification(payment_info)
                    return jsonify({'status': 'ok'})
        
        return jsonify({'status': 'ok'}), 200
        
    except Exception as e:
        print(f"Erro no webhook: {str(e)}")
        return jsonify({'error': 'Erro interno'}), 500

def get_payment_info(payment_id):
    """
    Busca informações de um pagamento específico
    """
    try:
        headers = {
            'Authorization': f'Bearer {MERCADOPAGO_ACCESS_TOKEN}',
            'Content-Type': 'application/json'
        }
        
        response = requests.get(
            f'{MERCADOPAGO_API_BASE}/v1/payments/{payment_id}',
            headers=headers
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Erro ao buscar pagamento {payment_id}: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"Erro ao buscar pagamento: {str(e)}")
        return None

def process_payment_notification(payment_info):
    """
    Processa a notificação de pagamento e controla a geladeira
    """
    try:
        payment_status = payment_info.get('status')
        payment_id = payment_info.get('id')
        external_reference = payment_info.get('external_reference')
        
        print(f"Processando pagamento {payment_id} - Status: {payment_status}")
        
        if payment_status == 'approved':
            # Pagamento aprovado - destravar geladeira
            print(f"Pagamento {payment_id} aprovado! Destravando geladeira...")
            
            # Enviar comando para ESP8266
            esp_response = send_unlock_command_to_esp()
            
            if esp_response:
                print("Comando de destravamento enviado com sucesso para ESP8266")
                # Aqui você pode salvar no banco de dados o registro da transação
                save_transaction_log(payment_id, external_reference, 'approved', 'unlocked')
            else:
                print("Erro ao enviar comando para ESP8266")
                save_transaction_log(payment_id, external_reference, 'approved', 'unlock_failed')
                
        elif payment_status == 'rejected':
            print(f"Pagamento {payment_id} rejeitado")
            save_transaction_log(payment_id, external_reference, 'rejected', 'locked')
            
        elif payment_status == 'pending':
            print(f"Pagamento {payment_id} pendente")
            save_transaction_log(payment_id, external_reference, 'pending', 'locked')
            
    except Exception as e:
        print(f"Erro ao processar notificação: {str(e)}")

def send_unlock_command_to_esp():
    """
    Envia comando de destravamento para o ESP8266
    """
    try:
        # IP do ESP8266 (configure conforme sua rede)
        ESP8266_IP = os.getenv('ESP8266_IP', '192.168.1.100')
        ESP8266_PORT = os.getenv('ESP8266_PORT', '80')
        
        # Enviar comando HTTP para o ESP8266
        response = requests.post(
            f'http://{ESP8266_IP}:{ESP8266_PORT}/unlock',
            json={'command': 'unlock', 'duration': 60},
            timeout=10
        )
        
        if response.status_code == 200:
            return True
        else:
            print(f"ESP8266 respondeu com status: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"Erro ao comunicar com ESP8266: {str(e)}")
        return False
    except Exception as e:
        print(f"Erro geral ao enviar comando: {str(e)}")
        return False

def save_transaction_log(payment_id, external_reference, payment_status, lock_status):
    """
    Salva log da transação (implementar conforme necessário)
    """
    try:
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'payment_id': payment_id,
            'external_reference': external_reference,
            'payment_status': payment_status,
            'lock_status': lock_status
        }
        
        # Salvar em arquivo de log (ou banco de dados)
        log_file = os.path.join(os.path.dirname(__file__), '..', 'logs', 'transactions.log')
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        
        with open(log_file, 'a') as f:
            f.write(json.dumps(log_entry) + '\n')
            
        print(f"Log salvo: {log_entry}")
        
    except Exception as e:
        print(f"Erro ao salvar log: {str(e)}")

def validate_webhook_signature(payload, signature):
    """
    Valida a assinatura do webhook do Mercado Pago
    """
    try:
        # Extrair timestamp e hash da assinatura
        parts = signature.split(',')
        ts = None
        v1 = None
        
        for part in parts:
            if part.startswith('ts='):
                ts = part[3:]
            elif part.startswith('v1='):
                v1 = part[3:]
        
        if not ts or not v1:
            return False
        
        # Criar string para validação
        # Formato: id:[data.id];request-id:[x-request-id];ts:[ts];
        request_id = request.headers.get('x-request-id', '')
        data_id = request.args.get('data.id', '')
        
        validation_string = f"id:{data_id};request-id:{request_id};ts:{ts};"
        
        # Calcular HMAC
        expected_signature = hmac.new(
            WEBHOOK_SECRET.encode('utf-8'),
            validation_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(expected_signature, v1)
        
    except Exception as e:
        print(f"Erro na validação da assinatura: {str(e)}")
        return False

@mercadopago_bp.route('/test-esp', methods=['POST'])
def test_esp_connection():
    """
    Endpoint para testar conexão com ESP8266
    """
    try:
        result = send_unlock_command_to_esp()
        if result:
            return jsonify({'status': 'success', 'message': 'Comando enviado com sucesso'})
        else:
            return jsonify({'status': 'error', 'message': 'Erro ao enviar comando'}), 500
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@mercadopago_bp.route('/status', methods=['GET'])
def get_status():
    """
    Endpoint para verificar status do sistema
    """
    return jsonify({
        'status': 'online',
        'timestamp': datetime.now().isoformat(),
        'mercadopago_configured': MERCADOPAGO_ACCESS_TOKEN != 'TEST-YOUR-ACCESS-TOKEN'
    })

