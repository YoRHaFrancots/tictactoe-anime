"""Servidor local para desarrollo, sin caché (así siempre ves la última versión).

Uso:  python tools/serve.py   y abrí http://localhost:8000
"""
import functools
import http.server
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    handler = functools.partial(NoCacheHandler, directory=str(ROOT))
    print("Jugá en http://localhost:8000")
    http.server.ThreadingHTTPServer(("", 8000), handler).serve_forever()
