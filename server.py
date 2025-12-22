#!/usr/bin/env python3
"""
Minimal static server with a simple /save endpoint to persist match JSON.
Run: python server.py
Open: http://localhost:8000/
"""
import http.server
import socketserver
import json
import os
from urllib.parse import urlparse

PORT = 8000
ROOT = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == '/matches':
            matches_dir = os.path.join(ROOT, 'matches')
            out = []
            if os.path.isdir(matches_dir):
                for fname in sorted(os.listdir(matches_dir), reverse=True):
                    fpath = os.path.join(matches_dir, fname)
                    try:
                        with open(fpath, 'r', encoding='utf-8') as f:
                            content = json.load(f)
                        out.append({'filename': fname, 'name': content.get('teamA',{}).get('name','') + ' vs ' + content.get('teamB',{}).get('name',''), 'content': content})
                    except Exception:
                        continue
            self.send_response(200)
            self.send_header('Content-Type','application/json')
            self.end_headers()
            self.wfile.write(json.dumps(out).encode('utf-8'))
            return
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == '/save':
            length = int(self.headers.get('content-length', 0))
            body = self.rfile.read(length)
            try:
                data = json.loads(body.decode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b'Invalid JSON')
                return

            matches_dir = os.path.join(ROOT, 'matches')
            os.makedirs(matches_dir, exist_ok=True)
            fname = os.path.join(matches_dir, f'match_{int(__import__("time").time())}.json')
            with open(fname, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)

            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'Saved')
            return

        if parsed.path == '/delete':
            length = int(self.headers.get('content-length', 0))
            body = self.rfile.read(length)
            try:
                data = json.loads(body.decode('utf-8'))
                filename = data.get('filename')
                if not filename:
                    raise ValueError('missing filename')
                path = os.path.join(ROOT, 'matches', filename)
                if os.path.exists(path):
                    os.remove(path)
                    self.send_response(200)
                    self.end_headers()
                    self.wfile.write(b'Deleted')
                    return
            except Exception:
                pass
            self.send_response(400)
            self.end_headers()
            return

        # fallback
        self.send_response(404)
        self.end_headers()


if __name__ == '__main__':
    os.chdir(ROOT)
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nStopped')
            httpd.server_close()
