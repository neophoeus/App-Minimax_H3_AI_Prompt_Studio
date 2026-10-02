@echo off
title MiniMax-H3 AI Studio Pure Packager
cls

echo ======================================================================
echo           MiniMax-H3 AI Prompt Studio - Google AI Studio Pure Packager
echo ======================================================================
echo.

where node >nul 2>nul
if errorlevel 1 goto :ERR_NODE

echo [*] Filtering pure files and exporting to dist-aistudio/...
call npx tsx scripts/pack-aistudio.ts
if errorlevel 1 goto :ERR_PACK

echo.
echo [*] Compressing pure files into minimax-h3-aistudio.zip ...
if exist "minimax-h3-aistudio.zip" del /f /q "minimax-h3-aistudio.zip" >nul 2>nul

powershell -NoProfile -Command "Compress-Archive -Path 'dist-aistudio\*' -DestinationPath 'minimax-h3-aistudio.zip' -Force"
if errorlevel 1 goto :ERR_ZIP

echo.
echo ======================================================================
echo  [+] Packaging Complete!
echo  Output Zip: %~dp0minimax-h3-aistudio.zip
echo  Pure Dist:  %~dp0dist-aistudio\
echo.
echo  [AI Studio Deployment Notes]:
echo  1. All local offline engines (Ollama / llama.cpp) and .bat scripts excluded.
echo  2. server.ts is automatically configured for Google AI Studio cloud engine.
echo  3. Upload minimax-h3-aistudio.zip directly to Google AI Studio!
echo ======================================================================
echo.
goto :END

:ERR_NODE
echo [ERROR] Node.js is not found. Please install Node.js v18+.
goto :END

:ERR_PACK
echo [ERROR] An error occurred while generating dist-aistudio.
goto :END

:ERR_ZIP
echo [ERROR] PowerShell Compress-Archive failed.
goto :END

:END
if "%1"=="" pause
