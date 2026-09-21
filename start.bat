@echo off
title MiniMax-H3 AI Prompt Studio v2.2.0
cls

echo ======================================================================
echo           MiniMax-H3 AI Prompt Studio [v2.2.0]
echo           AI Engine: Quad-Engine Architecture [AI Studio + Ollama + llama.cpp + Paid API]
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

echo [*] Checking local Ollama service [http://127.0.0.1:11434]...
curl -s -m 2 http://127.0.0.1:11434/api/tags >nul 2>nul
if %errorlevel% equ 0 (
    echo [+] Local Ollama is ONLINE [Qwen3.8-27B-Uncensored ready]
    goto :OLLAMA_CHECK_DONE
)

echo [i] Local Ollama is not running. Attempting to start Ollama...
if exist "%LOCALAPPDATA%\Programs\Ollama\ollama app.exe" (
    start "" "%LOCALAPPDATA%\Programs\Ollama\ollama app.exe"
    goto :WAIT_OLLAMA
)

where ollama >nul 2>nul
if %errorlevel% equ 0 (
    start "Ollama Service" /min ollama serve
    goto :WAIT_OLLAMA
)

echo [i] Ollama is not installed on system. Continuing with other engines...
goto :OLLAMA_CHECK_DONE

:WAIT_OLLAMA
echo [*] Waiting for Ollama service to initialize...
for /l %%i in (1,1,15) do (
    ping 127.0.0.1 -n 2 >nul
    curl -s -m 2 http://127.0.0.1:11434/api/tags >nul 2>nul && goto :OLLAMA_READY
)
echo [!] Ollama was launched but timed out waiting for API. Proceeding anyway...
goto :OLLAMA_CHECK_DONE

:OLLAMA_READY
echo [+] Local Ollama started successfully [ONLINE]

:OLLAMA_CHECK_DONE
echo.

echo [*] Checking local llama.cpp service [http://127.0.0.1:8080]...
curl -s -m 2 http://127.0.0.1:8080/v1/models >nul 2>nul
if %errorlevel% equ 0 (
    echo [+] Local llama.cpp is ONLINE [http://127.0.0.1:8080] [RTX 5090 Ready]
    goto :LLAMACPP_CHECK_DONE
)
curl -s -m 2 http://127.0.0.1:8080/health >nul 2>nul
if %errorlevel% equ 0 (
    echo [+] Local llama.cpp is ONLINE [http://127.0.0.1:8080] [RTX 5090 Ready]
    goto :LLAMACPP_CHECK_DONE
)

echo [i] Local llama.cpp is not running.
if exist "C:\llama.cpp\llama-server.exe" (
    echo [*] Detected C:\llama.cpp environment. Launching model selector in new window...
    start "llama.cpp Server" "%~dp0start_llama.bat"
    goto :WAIT_LLAMACPP
)

where llama-server >nul 2>nul
if %errorlevel% equ 0 (
    echo [*] Detected llama-server in PATH. Launching model selector in new window...
    start "llama.cpp Server" "%~dp0start_llama.bat"
    goto :WAIT_LLAMACPP
)

echo [i] llama.cpp is not configured. [You can run start_llama.bat anytime]
goto :LLAMACPP_CHECK_DONE

:WAIT_LLAMACPP
echo [*] Waiting for llama.cpp service to initialize...
for /l %%i in (1,1,8) do (
    ping 127.0.0.1 -n 2 >nul
    curl -s -m 2 http://127.0.0.1:8080/v1/models >nul 2>nul && goto :LLAMACPP_READY
    curl -s -m 2 http://127.0.0.1:8080/health >nul 2>nul && goto :LLAMACPP_READY
)
echo [i] llama.cpp window opened. Proceeding to start Prompt Studio...
goto :LLAMACPP_CHECK_DONE

:LLAMACPP_READY
echo [+] Local llama.cpp started successfully [ONLINE]

:LLAMACPP_CHECK_DONE
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
echo Please download and install Node.js [v18 or higher]:
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
echo.
echo ======================================================================
echo   MiniMax-H3 Prompt Studio 服務已結束。按任意鍵關閉此視窗...
echo ======================================================================
pause >nul
