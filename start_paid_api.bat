@echo off
title MiniMax-H3 Studio [Gemini Paid API Direct Engine]
cls

echo ======================================================================
echo           MiniMax-H3 AI Prompt Studio
echo           Engine: Gemini Paid API Direct (Flagship 3.8 Flash)
echo ======================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on your system.
    pause
    exit /b 1
)

if not exist ".env" (
    echo [*] Initializing .env from .env.example ...
    copy ".env.example" ".env" >nul
)

findstr /i "GEMINI_API_KEY=" .env >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] GEMINI_API_KEY is not configured in .env file!
    echo Please ensure you add your GEMINI_API_KEY in .env before generating.
    echo.
)

echo [*] Starting Paid API Studio Server on http://localhost:3000 ...
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

call npx tsx server-paid-api.ts
pause
