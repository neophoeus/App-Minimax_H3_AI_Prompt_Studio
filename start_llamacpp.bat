@echo off
if "%1"=="--server" goto :LLAMA_SERVER_MODE

title MiniMax-H3 Studio [Local llama.cpp RTX 5090 Studio]
cls

echo ======================================================================
echo           MiniMax-H3 AI Prompt Studio
echo           Engine: Local llama.cpp (RTX 5090 - http://127.0.0.1:8080)
echo ======================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on your system.
    pause
    exit /b 1
)

echo [*] Checking local llama.cpp server (port 8080) status...
curl -s -m 2 http://127.0.0.1:8080/v1/models >nul 2>nul
if %errorlevel% equ 0 (
    echo [+] Local llama.cpp server is ONLINE
    goto :START_STUDIO
)
curl -s -m 2 http://127.0.0.1:8080/health >nul 2>nul
if %errorlevel% equ 0 (
    echo [+] Local llama.cpp server is ONLINE
    goto :START_STUDIO
)

echo [i] Local llama.cpp server is not running on port 8080.
if exist "C:\llama.cpp\llama-server.exe" goto :LAUNCH_MODEL_SERVER
where llama-server >nul 2>nul
if %errorlevel% equ 0 goto :LAUNCH_MODEL_SERVER

echo [WARNING] C:\llama.cpp\llama-server.exe or llama-server was not found.
echo Please ensure llama.cpp is running on http://127.0.0.1:8080.
goto :START_STUDIO

:LAUNCH_MODEL_SERVER
echo [*] Opening llama.cpp model selector in a new window...
start "llama.cpp Model Server" "%~f0" --server

echo [*] Waiting for llama-server to load model and become ready...
for /l %%i in (1,1,30) do (
    ping 127.0.0.1 -n 2 >nul
    curl -s -m 2 http://127.0.0.1:8080/health >nul 2>nul && goto :LLAMA_READY
    curl -s -m 2 http://127.0.0.1:8080/v1/models >nul 2>nul && goto :LLAMA_READY
)
echo [!] Timed out waiting for llama-server. Proceeding to start Studio...
goto :START_STUDIO

:LLAMA_READY
echo [+] Local llama.cpp server is ready [ONLINE]

:START_STUDIO
echo.
echo [*] Starting llama.cpp Studio Server on http://localhost:3000 ...
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

call npx tsx server-llamacpp.ts
pause
exit /b 0

:: ======================================================================
::  LLAMA.CPP Model Server Launcher (RTX 5090 Accelerated)
:: ======================================================================
:LLAMA_SERVER_MODE
title llama.cpp Server [RTX 5090]
setlocal enabledelayedexpansion

cd /d C:\llama.cpp

cls
echo ======================================================================
echo           MiniMax-H3 AI Prompt Studio - Local llama.cpp Engine
echo           Model Selector & Acceleration Launcher [RTX 5090 - 32GB VRAM]
echo ======================================================================
echo.

if not exist "llama-server.exe" (
    echo [ERROR] C:\llama.cpp\llama-server.exe not found.
    pause
    exit /b 1
)

if not exist "models\" (
    echo [ERROR] C:\llama.cpp\models directory not found.
    pause
    exit /b 1
)

:: Terminate old running llama-server if port 8080 is occupied
for /f "tokens=2" %%p in ('tasklist ^| findstr /i "llama-server.exe"') do (
    set "RUNNING_PID=%%p"
)
if defined RUNNING_PID (
    echo [!] Detected existing llama-server running [PID: !RUNNING_PID!].
    set /p kill_old="Terminate old process to load new model? [Y/n, Default: Y]: "
    if "!kill_old!"=="" set "kill_old=Y"
    if /i "!kill_old!"=="Y" (
        echo [*] Terminating old process...
        taskkill /f /pid !RUNNING_PID! >nul 2>nul
        timeout /t 1 /nobreak >nul
    )
)

echo [*] Scanning C:\llama.cpp\models for GGUF models and mmproj vision projectors...
echo.

set count=0
for /r "C:\llama.cpp\models" %%f in (*.gguf) do (
    set "fname=%%~nxf"
    echo !fname! | findstr /i "mmproj" >nul
    if errorlevel 1 (
        echo !fname! | findstr /i "FastMTP" >nul
        if errorlevel 1 (
            echo !fname! | findstr /i "draft" >nul
            if errorlevel 1 (
                set /a count+=1
                set "file_!count!=%%f"
                set "dir_!count!=%%~dpf"
                set "name_!count!=%%~nxf"
                
                set "has_mmproj_!count!=None"
                set "item_tag="
                echo !fname! | findstr /i "Gemma4" >nul && set "item_tag=Gemma4"
                if not defined item_tag (
                    echo !fname! | findstr /i "Qwen3.8" >nul && set "item_tag=Qwen3.8"
                )
                if not defined item_tag (
                    echo !fname! | findstr /i "Qwen" >nul && set "item_tag=Qwen"
                )
                if not defined item_tag (
                    echo !fname! | findstr /i "Gemma" >nul && set "item_tag=Gemma"
                )
                if defined item_tag (
                    for /f "delims=" %%m in ('dir /b "%%~dpf*mmproj*!item_tag!*.gguf" 2^>nul') do (
                        set "has_mmproj_!count!=Matched [%%~nxm]"
                    )
                )
                if "!has_mmproj_!count!"=="None" (
                    for /f "delims=" %%m in ('dir /b "%%~dpfmmproj*.gguf" 2^>nul') do (
                        set "has_mmproj_!count!=Matched [%%~nxm]"
                    )
                )
                
                set "mtp_tag_!count!=Standard Autoregressive"
                echo !fname! | findstr /i "Qwen3.8 DeepSeek-V3 FastMTP MTP" >nul
                if not errorlevel 1 (
                    set "mtp_tag_!count!=Embedded MTP (2.23x Speedup)"
                )
            )
        )
    )
)

if %count%==0 (
    echo [ERROR] No GGUF models found in C:\llama.cpp\models.
    pause
    exit /b 1
)

echo ----------------------------------------------------------------------
echo Available GGUF Models:
echo ----------------------------------------------------------------------
for /l %%i in (1,1,%count%) do (
    echo   [%%i] !name_%%i!
    echo       Vision Projector: !has_mmproj_%%i!
    echo       Acceleration:     !mtp_tag_%%i!
    echo.
)
echo ----------------------------------------------------------------------

set /p choice="Enter model number to load [1-%count%, Default: 1]: "
if "!choice!"=="" set "choice=1"

if not defined file_%choice% (
    echo [ERROR] Invalid selection. Exiting.
    pause
    exit /b 1
)

set "SELECTED_MODEL=!file_%choice%!"
set "MODEL_DIR=!dir_%choice%!"
set "MODEL_NAME=!name_%choice%!"

:: Auto-pair mmproj
set "MMPROJ_FILE="
set "MMPROJ_NAME="
set "MMPROJ_ARG="

set "SEARCH_TAG="
echo !MODEL_NAME! | findstr /i "Gemma4" >nul && set "SEARCH_TAG=Gemma4"
if not defined SEARCH_TAG (
    echo !MODEL_NAME! | findstr /i "Qwen3.8" >nul && set "SEARCH_TAG=Qwen3.8"
)
if not defined SEARCH_TAG (
    echo !MODEL_NAME! | findstr /i "Qwen" >nul && set "SEARCH_TAG=Qwen"
)
if not defined SEARCH_TAG (
    echo !MODEL_NAME! | findstr /i "Gemma" >nul && set "SEARCH_TAG=Gemma"
)

if defined SEARCH_TAG (
    for /f "delims=" %%m in ('dir /b "!MODEL_DIR!*mmproj*!SEARCH_TAG!*.gguf" 2^>nul') do (
        if not defined MMPROJ_FILE (
            set "MMPROJ_FILE=!MODEL_DIR!%%m"
            set "MMPROJ_NAME=%%~nxm"
            set "MMPROJ_ARG=--mmproj "!MODEL_DIR!%%m""
        )
    )
)

if not defined MMPROJ_FILE (
    for /f "delims=" %%m in ('dir /b "!MODEL_DIR!mmproj*.gguf" 2^>nul') do (
        if not defined MMPROJ_FILE (
            set "MMPROJ_FILE=!MODEL_DIR!%%m"
            set "MMPROJ_NAME=%%~nxm"
            set "MMPROJ_ARG=--mmproj "!MODEL_DIR!%%m""
        )
    )
)

if not defined MMPROJ_FILE if defined SEARCH_TAG (
    for /f "delims=" %%m in ('dir /b /s "C:\llama.cpp\models\*mmproj*!SEARCH_TAG!*.gguf" 2^>nul') do (
        if not defined MMPROJ_FILE (
            set "MMPROJ_FILE=%%m"
            set "MMPROJ_NAME=%%~nxm"
            set "MMPROJ_ARG=--mmproj "%%m""
        )
    )
)

if not defined MMPROJ_FILE (
    for /f "delims=" %%m in ('dir /b /s "C:\llama.cpp\models\mmproj*.gguf" 2^>nul') do (
        if not defined MMPROJ_FILE (
            set "MMPROJ_FILE=%%m"
            set "MMPROJ_NAME=%%~nxm"
            set "MMPROJ_ARG=--mmproj "%%m""
        )
    )
)

:: MTP acceleration flag
set "MTP_ARG="
set "MTP_DESC="
echo !MODEL_NAME! | findstr /i "Qwen3.8 DeepSeek-V3 FastMTP MTP" >nul
if not errorlevel 1 (
    set "MTP_ARG=--spec-type draft-mtp"
    set "MTP_DESC=Embedded MTP [2.23x Speedup]"
) else (
    set "MTP_ARG="
    set "MTP_DESC=Standard Autoregressive"
)

cls
echo ======================================================================
echo           MiniMax-H3 AI Prompt Studio - llama.cpp Server Launching
echo ======================================================================
echo [*] Model:        !SELECTED_MODEL!
if defined MMPROJ_NAME (
    echo [+] Projector:    !MMPROJ_NAME! [Multi-modal Vision Ready]
) else (
    echo [i] Projector:    None [Text Inference Mode]
)
echo [+] Acceleration: !MTP_DESC!
echo [*] GPU Offload:  -ngl 99 [RTX 5090 32GB VRAM Full Layers]
echo [*] Optimizations: --flash-attn on, -c 32768 [32K Context]
echo [*] Endpoint:     http://127.0.0.1:8080
echo ======================================================================
echo.

llama-server.exe -m "!SELECTED_MODEL!" !MMPROJ_ARG! !MTP_ARG! -ngl 99 --flash-attn on -c 32768 --host 127.0.0.1 --port 8080

pause
exit /b 0
