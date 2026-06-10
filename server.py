"""
Deep Haven 本地数据服务器
用法: python server.py
然后浏览器打开 http://localhost:8765/editor.html
编辑器中的"直接保存"按钮会通过此服务器写入 config/ 文件
"""
import http.server
import json
import os
import sys
from pathlib import Path

PORT = 8765
SRC_DIR = Path(__file__).parent / "src"
CONFIG_DIR = SRC_DIR / "config"

class DeepHavenHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SRC_DIR), **kwargs)

    def do_POST(self):
        if self.path == "/api/save":
            try:
                length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(length).decode("utf-8")
                data = json.loads(body)
                filename = data.get("file", "")
                content = data.get("content", "")

                # 安全检查：只允许写入 config/ 下的 .js 文件
                if not filename.endswith(".js") or "/" in filename or "\\" in filename or ".." in filename:
                    self.send_json(400, {"ok": False, "error": "非法文件名"})
                    return

                filepath = CONFIG_DIR / filename
                filepath.write_text(content, encoding="utf-8")

                print(f"  ✅ 已保存: config/{filename}  ({len(content)} 字节)")
                self.send_json(200, {"ok": True, "file": filename, "size": len(content)})

            except Exception as e:
                print(f"  ❌ 保存失败: {e}")
                self.send_json(500, {"ok": False, "error": str(e)})
        else:
            self.send_json(404, {"ok": False, "error": "未知 API"})

    def send_json(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", len(body))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, format, *args):
        # 精简日志，只显示 GET/POST
        if args and isinstance(args[0], str) and (args[0].startswith("GET") or args[0].startswith("POST")):
            print(f"  {args[0]}")


if __name__ == "__main__":
    print(f"""
╔══════════════════════════════════════╗
║     Deep Haven — 数据编辑器服务       ║
║                                      ║
║  地址: http://localhost:{PORT}/editor.html
║  按 Ctrl+C 停止服务器                 ║
╚══════════════════════════════════════╝
""")
    server = http.server.HTTPServer(("0.0.0.0", PORT), DeepHavenHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n服务器已停止。")
        server.server_close()
