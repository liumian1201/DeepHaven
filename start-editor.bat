@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   Deep Haven — 数据编辑器
echo ============================================
echo.
echo 正在启动本地服务...
echo 浏览器打开后，请访问: http://localhost:8765/editor.html
echo 按 Ctrl+C 停止服务器
echo.
start http://localhost:8765/editor.html
python server.py
pause
