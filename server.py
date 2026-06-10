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
from functools import partial

PORT = 8765
SRC_DIR = Path(__file__).parent / "src"
CONFIG_DIR = SRC_DIR / "config"
BACKUP_DIR = CONFIG_DIR / "_backup"

def backup_file(filepath):
    """保存前自动备份到 _backup/ 目录"""
    if not filepath.exists():
        return
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    from datetime import datetime
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_name = f"{filepath.stem}.{timestamp}{filepath.suffix}"
    backup_path = BACKUP_DIR / backup_name
    backup_path.write_bytes(filepath.read_bytes())
    # 只保留最近 20 个备份
    backups = sorted(BACKUP_DIR.glob(f"{filepath.stem}.*{filepath.suffix}"))
    for old in backups[:-20]:
        old.unlink()

class DeepHavenHandler(http.server.SimpleHTTPRequestHandler):

    def do_POST(self):
        if self.path == "/api/save":
            try:
                length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(length).decode("utf-8")
                data = json.loads(body)
                filename = data.get("file", "")
                content = data.get("content", "")

                # 安全检查：只允许写入 config/ 下的 .json 文件
                if not (filename.endswith(".json") or filename.endswith(".js")) or "/" in filename or "\\" in filename or ".." in filename:
                    self.send_json(400, {"ok": False, "error": "非法文件名"})
                    return

                filepath = CONFIG_DIR / filename
                backup_file(filepath)
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
    server = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), partial(DeepHavenHandler, directory=str(SRC_DIR)))
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n服务器已停止。")
        server.server_close()
