import requests
from flask import current_app

class ESP8266Service:
    """Serviço para comunicação com o ESP8266."""
    
    def __init__(self):
        self.esp_ip = current_app.config['ESP8266_IP']
        self.esp_port = current_app.config['ESP8266_PORT']
        self.timeout = current_app.config['ESP8266_TIMEOUT']
    
    def send_unlock_command(self, duration=60):
        """Envia comando de destravamento para o ESP8266."""
        try:
            url = f'http://{self.esp_ip}:{self.esp_port}/unlock'
            
            payload = {
                'command': 'unlock',
                'duration': duration,
                'timestamp': self._get_timestamp()
            }
            
            response = requests.post(
                url,
                json=payload,
                timeout=self.timeout,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                return {
                    'success': True,
                    'message': 'Comando de destravamento enviado com sucesso',
                    'esp_response': response.text,
                    'status_code': response.status_code
                }
            else:
                return {
                    'success': False,
                    'error': f'ESP8266 respondeu com status: {response.status_code}',
                    'esp_response': response.text,
                    'status_code': response.status_code
                }
                
        except requests.exceptions.Timeout:
            return {
                'success': False,
                'error': 'Timeout na comunicação com ESP8266',
                'esp_response': None,
                'status_code': None
            }
        except requests.exceptions.ConnectionError:
            return {
                'success': False,
                'error': f'Erro de conexão com ESP8266 ({self.esp_ip}:{self.esp_port})',
                'esp_response': None,
                'status_code': None
            }
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': f'Erro na requisição para ESP8266: {str(e)}',
                'esp_response': None,
                'status_code': None
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Erro interno: {str(e)}',
                'esp_response': None,
                'status_code': None
            }
    
    def send_lock_command(self):
        """Envia comando de travamento para o ESP8266."""
        try:
            url = f'http://{self.esp_ip}:{self.esp_port}/lock'
            
            payload = {
                'command': 'lock',
                'timestamp': self._get_timestamp()
            }
            
            response = requests.post(
                url,
                json=payload,
                timeout=self.timeout,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                return {
                    'success': True,
                    'message': 'Comando de travamento enviado com sucesso',
                    'esp_response': response.text,
                    'status_code': response.status_code
                }
            else:
                return {
                    'success': False,
                    'error': f'ESP8266 respondeu com status: {response.status_code}',
                    'esp_response': response.text,
                    'status_code': response.status_code
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Erro ao enviar comando de travamento: {str(e)}',
                'esp_response': None,
                'status_code': None
            }
    
    def get_status(self):
        """Obtém o status atual do ESP8266."""
        try:
            url = f'http://{self.esp_ip}:{self.esp_port}/status'
            
            response = requests.get(
                url,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                return {
                    'success': True,
                    'status': response.json() if response.headers.get('content-type') == 'application/json' else response.text,
                    'esp_response': response.text,
                    'status_code': response.status_code
                }
            else:
                return {
                    'success': False,
                    'error': f'ESP8266 respondeu com status: {response.status_code}',
                    'esp_response': response.text,
                    'status_code': response.status_code
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Erro ao obter status do ESP8266: {str(e)}',
                'esp_response': None,
                'status_code': None
            }
    
    def test_connection(self):
        """Testa a conexão com o ESP8266."""
        try:
            url = f'http://{self.esp_ip}:{self.esp_port}/ping'
            
            response = requests.get(
                url,
                timeout=5  # Timeout menor para teste
            )
            
            return {
                'success': True,
                'message': 'Conexão com ESP8266 estabelecida',
                'esp_response': response.text,
                'status_code': response.status_code,
                'response_time': response.elapsed.total_seconds()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Falha na conexão com ESP8266: {str(e)}',
                'esp_response': None,
                'status_code': None
            }
    
    def _get_timestamp(self):
        """Retorna timestamp atual em formato ISO."""
        from datetime import datetime
        return datetime.utcnow().isoformat()
    
    def is_configured(self):
        """Verifica se o ESP8266 está configurado."""
        return (
            self.esp_ip != '192.168.1.100' and  # IP padrão
            self.esp_ip != 'localhost' and
            self.esp_ip != '127.0.0.1'
        )
