@echo off
title MiniMax-H3 Studio [Local Ollama Offline Engine]
cls

echo ======================================================================
echo           MiniMax-H3 AI Prompt Studio
echo           Engine: Local Ollama Offline (http://127.0.0.1:11434)
echo ======================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on your system.
    pause
    exit /b 1
)

echo [*] Checking local Ollama service status...
curl -s -m 2 http://127.0.0.1:11434/api/tags >nul 2>nul
if %errorlevel% equ 0 (
    echo [+] Local Ollama service is ONLINE
    goto :START_SERVER
)

echo [i] Local Ollama is not running. Attempting to launch Ollama...
if exist "%LOCALAPPDATA%\Programs\Ollama\ollama app.exe" (
    start "" "%LOCALAPPDATA%\Programs\Ollama\ollama app.exe"
    goto :WAIT_OLLAMA
)

where ollama >nul 2>nul
if %errorlevel% equ 0 (
    start "Ollama Service" /min ollama serve
    goto :WAIT_OLLAMA
)

echo [WARNING] Ollama is not found on system path. Proceeding anyway...
goto :START_SERVER

:WAIT_OLLAMA
echo [*] Waiting for Ollama service to initialize...
for /l %%i in (1,1,10) do (
    ping 127.0.0.1 -n 2 >nul
    curl -s -m 2 http://127.0.0.1:11434/api/tags >nul 2>nul && goto :OLLAMA_READY
)
echo [!] Timed out waiting for Ollama API. Starting Studio anyway...
goto :START_SERVER

:OLLAMA_READY
echo [+] Local Ollama service started successfully [ONLINE]

:START_SERVER
echo.
echo [*] Starting Ollama Studio Server on http://localhost:3000 ...
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

call npx tsx server-ollama.ts
pause
