@echo off
title MiniMax-H3 AI Prompt Studio v2.1.0
cls

echo ======================================================================
echo           MiniMax-H3 AI Prompt Studio [v2.1.0]
echo           AI Engine: 3 Modes (AI Studio + Ollama + Paid API)
echo ======================================================================
echo.

echo [*] Checking Node.js environment...
where node >nul 2>nul
if %errorlevel% neq 0 goto :NO_NODE

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo [+] Node.js is ready: %NODE_VER%
echo.

if not exist ".env" (
    echo [*] Initializing .env from .env.example...
    copy ".env.example" ".env" >nul
    echo [+] Created .env configuration file
    echo.
)

if not exist "node_modules\" (
    echo [*] Installing dependencies with npm install...
    call npm install
    if %errorlevel% neq 0 goto :INSTALL_FAIL
    echo [+] Dependencies installed successfully
    echo.
)

echo [*] Checking local Ollama service (http://127.0.0.1:11434)...
curl -s -m 2 http://127.0.0.1:11434/api/tags >nul 2>nul
if %errorlevel% equ 0 (
    echo [+] Local Ollama is ONLINE [Qwen3.8-27B-Uncensored ready]
) else (
    echo [i] Local Ollama is OFFLINE [Cloud Gemini mode is available]
)
echo.

echo [*] Starting Studio server at http://localhost:3000 ...
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

echo ======================================================================
echo   MiniMax-H3 AI Prompt Studio is running!
echo   Browser will open automatically at: http://localhost:3000
echo   To stop the studio, press Ctrl+C or close this window.
echo ======================================================================
echo.

call npm run dev
goto :END

:NO_NODE
echo.
echo [ERROR] Node.js is not found on your system.
echo Please download and install Node.js (v18 or higher):
echo https://nodejs.org/
echo.
pause
exit /b 1

:INSTALL_FAIL
echo.
echo [ERROR] Failed to install dependencies via npm install.
echo Please check your internet connection and try again.
echo.
pause
exit /b 1

:END
if %errorlevel% neq 0 pause
