"""سرور ساختگی سفیر بله برای آزمون: کلید را بررسی می‌کند، کدها را نگه می‌دارد؛ شماره‌ای که به ۹۹ ختم شود «حساب بله ندارد» (کد ۱۷)"""
import json
from http.server import BaseHTTPRequestHandler, HTTPServer
KEY = 'test-safir-key'
STATE = {'sent': []}
class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def send(self, code, obj):
        b = json.dumps(obj).encode(); self.send_response(code); self.send_header('Content-Type', 'application/json'); self.send_header('Content-Length', str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        if self.path == '/state': return self.send(200, STATE)
        self.send(404, {})
    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers.get('Content-Length') or 0)) or b'{}')
        if self.path == '/reset': STATE['sent'].clear(); return self.send(200, {})
        if self.path != '/api/v3/send_message': return self.send(404, {})
        if self.headers.get('api-access-key') != KEY: return self.send(401, {'error': 'unauthorized'})
        ph = body.get('phone_number', ''); otp = (body.get('message_data') or {}).get('otp_message', {}).get('otp')
        if ph.endswith('99'): return self.send(200, {'message_id': None, 'error_data': [{'phone_number': ph, 'code': 17, 'description': 'not bale user'}]})
        STATE['sent'].append({'phone': ph, 'otp': otp, 'bot_id': body.get('bot_id')})
        self.send(200, {'message_id': len(STATE['sent']), 'error_data': None})
if __name__ == '__main__': HTTPServer(('127.0.0.1', 9310), H).serve_forever()
