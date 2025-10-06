import requests
import hashlib
import hmac
from flask import current_app, request

class MercadoPagoService:
    """Serviço para integração com a API do Mercado Pago."""
    
    def __init__(self):
        self.access_token = current_app.config['MERCADOPAGO_ACCESS_TOKEN']
        self.public_key = current_app.config['MERCADOPAGO_PUBLIC_KEY']
        self.api_base = current_app.config['MERCADOPAGO_API_BASE']
        self.webhook_secret = current_app.config['WEBHOOK_SECRET']
    
    def get_headers(self):
        """Retorna headers para requisições à API do Mercado Pago."""
        return {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
    
    def create_payment_preference(self, order):
        """Cria uma preferência de pagamento no Mercado Pago."""
        try:
            # Preparar itens para o Mercado Pago
            items = []
            for item in order.items:
                items.append({
                    'id': str(item.product_id),
                    'title': item.product.name,
                    'description': item.product.description or item.product.name,
                    'quantity': item.quantity,
                    'unit_price': item.unit_price,
                    'currency_id': 'BRL'
                })
            
            # URLs de retorno
            base_url = request.host_url.rstrip('/')
            back_urls = {
                'success': f'{base_url}/payment/success',
                'failure': f'{base_url}/payment/failure',
                'pending': f'{base_url}/payment/pending'
            }
            
            # Dados da preferência
            preference_data = {
                'items': items,
                'external_reference': order.external_reference,
                'back_urls': back_urls,
                'auto_return': 'approved',
                'notification_url': f'{base_url}/api/webhook/mercadopago',
                'statement_descriptor': 'Geladeira Inteligente',
                'payment_methods': {
                    'excluded_payment_types': [],
                    'installments': 12
                },
                'shipments': {
                    'mode': 'not_specified'
                },
                'payer': {}
            }
            
            # Adicionar informações do cliente se disponível
            if order.customer_email:
                preference_data['payer']['email'] = order.customer_email
            
            if order.customer_phone:
                preference_data['payer']['phone'] = {
                    'number': order.customer_phone
                }
            
            # Fazer requisição para o Mercado Pago
            response = requests.post(
                f'{self.api_base}/checkout/preferences',
                headers=self.get_headers(),
                json=preference_data,
                timeout=30
            )
            
            if response.status_code == 201:
                preference = response.json()
                return {
                    'success': True,
                    'preference_id': preference['id'],
                    'init_point': preference['init_point'],
                    'sandbox_init_point': preference.get('sandbox_init_point'),
                    'public_key': self.public_key
                }
            else:
                return {
                    'success': False,
                    'error': f'Erro do Mercado Pago: {response.status_code}',
                    'details': response.text
                }
                
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': 'Erro de conexão com Mercado Pago',
                'details': str(e)
            }
        except Exception as e:
            return {
                'success': False,
                'error': 'Erro interno',
                'details': str(e)
            }
    
    def get_payment_info(self, payment_id):
        """Busca informações de um pagamento específico."""
        try:
            response = requests.get(
                f'{self.api_base}/v1/payments/{payment_id}',
                headers=self.get_headers(),
                timeout=30
            )
            
            if response.status_code == 200:
                return {
                    'success': True,
                    'payment': response.json()
                }
            else:
                return {
                    'success': False,
                    'error': f'Erro ao buscar pagamento: {response.status_code}',
                    'details': response.text
                }
                
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': 'Erro de conexão com Mercado Pago',
                'details': str(e)
            }
        except Exception as e:
            return {
                'success': False,
                'error': 'Erro interno',
                'details': str(e)
            }
    
    def validate_webhook_signature(self, payload, signature):
        """Valida a assinatura do webhook do Mercado Pago."""
        try:
            if not signature or self.webhook_secret == 'your-webhook-secret':
                # Se não há assinatura ou o secret não foi configurado, pular validação
                return True
            
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
            request_id = request.headers.get('x-request-id', '')
            data_id = request.args.get('data.id', '')
            
            validation_string = f'id:{data_id};request-id:{request_id};ts:{ts};'
            
            # Calcular HMAC
            expected_signature = hmac.new(
                self.webhook_secret.encode('utf-8'),
                validation_string.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(expected_signature, v1)
            
        except Exception as e:
            current_app.logger.error(f'Erro na validação da assinatura: {e}')
            return False
    
    def process_webhook_notification(self, data):
        """Processa notificação do webhook do Mercado Pago."""
        try:
            # Verificar se é uma notificação de pagamento
            if data.get('type') != 'payment':
                return {'success': False, 'error': 'Tipo de notificação não suportado'}
            
            payment_id = data.get('data', {}).get('id')
            if not payment_id:
                return {'success': False, 'error': 'ID do pagamento não encontrado'}
            
            # Buscar informações do pagamento
            payment_result = self.get_payment_info(payment_id)
            if not payment_result['success']:
                return payment_result
            
            payment_info = payment_result['payment']
            
            return {
                'success': True,
                'payment_info': payment_info,
                'payment_id': payment_id,
                'status': payment_info.get('status'),
                'external_reference': payment_info.get('external_reference')
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': 'Erro ao processar webhook',
                'details': str(e)
            }
