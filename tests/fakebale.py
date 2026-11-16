"""بات ساختگی بله برای آزمون (روی ۹۳۲۰): همان رابط tapi.bale.ai.
POST /push  یک update در صف می‌گذارد؛ GET /state پیام‌هایی را که بات فرستاده برمی‌گرداند؛ POST /reset پاک می‌کند."""
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
TOKEN = 'test:bale-token'
STATE = {'updates': [], 'sent': [], 'next': 1}
class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def send(self, code, obj):
        b = json.dumps(obj, ensure_ascii=False).encode(); self.send_response(code); self.send_header('Content-Type', 'application/json'); self.send_header('Content-Length', str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        if self.path == '/state': return self.send(200, {'sent': STATE['sent'], 'pending': len(STATE['updates'])})
        self.send(404, {})
    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers.get('Content-Length') or 0)) or b'{}')
        if self.path == '/reset': STATE['updates'].clear(); STATE['sent'].clear(); return self.send(200, {})
        if self.path == '/push':
            body['update_id'] = STATE['next']; STATE['next'] += 1; STATE['updates'].append(body); return self.send(200, {})
        if not self.path.startswith(f'/bot{TOKEN}/'): return self.send(401, {'ok': False, 'description': 'Unauthorized'})
        m = self.path.rsplit('/', 1)[1]
        if m == 'getUpdates':
            off = body.get('offset') or 0
            STATE['updates'][:] = [u for u in STATE['updates'] if u['update_id'] >= off]
            return self.send(200, {'ok': True, 'result': STATE['updates'][:100]})
        if m == 'sendMessage': STATE['sent'].append(body); return self.send(200, {'ok': True, 'result': {'message_id': len(STATE['sent'])}})
        self.send(200, {'ok': True, 'result': True})
if __name__ == '__main__': ThreadingHTTPServer(('127.0.0.1', 9320), H).serve_forever()
