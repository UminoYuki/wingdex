@echo off
chcp 65001 >nul
title Wingdex · 生灵图鉴
cd /d "%~dp0"

if not exist "%~dp0.tmp" mkdir "%~dp0.tmp" 2>nul
set TEMP=%~dp0.tmp
set TMP=%~dp0.tmp

echo =======================================================
echo   🌟 Wingdex · 生灵图鉴 · 拍鸟与野生动物摄影图鉴
echo   🦜 模式: Web 模式 (API + Vite Web 前端)
echo   🔗 Web 端访问地址: http://127.0.0.1:5273
echo   🔗 后端接口地址:   http://127.0.0.1:5176
echo   💡 提示: 关闭本窗口即可停止服务
echo =======================================================
echo.

echo   等前端就绪后自动打开浏览器...
start "" /b powershell -NoProfile -WindowStyle Hidden -Command "for($i=0;$i -lt 180;$i++){try{Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 http://127.0.0.1:5273 | Out-Null; Start-Process http://127.0.0.1:5273; break}catch{Start-Sleep -Seconds 1}}"
call npm run dev

pause
