@echo off
title MiniMax-H3 Studio [Gemini 4 Hydrogen Direct Engine]
cls

echo ======================================================================
echo           MiniMax-H3 AI Prompt Studio
echo           Engine: Gemini 4 Hydrogen Direct (Free Tier / Pay-as-you-go)
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
) else (
    findstr /i "MY_GEMINI_API_KEY" .env >nul 2>nul
    if not errorlevel 1 (
        echo [WARNING] GEMINI_API_KEY in .env is still set to placeholder MY_GEMINI_API_KEY!
        echo Please replace it with your Google AI Studio Free Tier or Paid API Key.
        echo.
    )
)

echo [*] Starting Gemini API Studio Server on http://localhost:3000 ...
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

call npx tsx server-gemini-api.ts
pause
