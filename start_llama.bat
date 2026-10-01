@echo off
chcp 65001 >nul
title llama.cpp Server [RTX 5090]
setlocal enabledelayedexpansion

cd /d C:\llama.cpp

echo ======================================================================
echo           MiniMax-H3 AI Prompt Studio - 本地 llama.cpp 引擎
echo           智慧多模態與極速加速啟動器 [RTX 5090 - 32GB VRAM]
echo ======================================================================
echo.

if not exist "llama-server.exe" (
    echo [錯誤] 找不到 C:\llama.cpp\llama-server.exe，請確認 llama.cpp 路徑。
    pause
    exit /b 1
)

if not exist "models\" (
    echo [錯誤] 找不到 C:\llama.cpp\models 目錄。
    pause
    exit /b 1
)

REM 檢查背景是否有殘留的 llama-server 佔用 8080 端口
for /f "tokens=2" %%p in ('tasklist ^| findstr /i "llama-server.exe"') do (
    set "RUNNING_PID=%%p"
)
if defined RUNNING_PID (
    echo [!] 偵測到已有 llama-server 正在運行中 [PID: !RUNNING_PID!]。
    set /p kill_old="是否終止舊程序以載入新模型？ [Y/n, 直接按 Enter 預設 Y]: "
    if "!kill_old!"=="" set "kill_old=Y"
    if /i "!kill_old!"=="Y" (
        echo [*] 正在終止舊程序...
        taskkill /f /pid !RUNNING_PID! >nul 2>nul
        timeout /t 1 /nobreak >nul
    )
)

echo [*] 正在智慧掃描 C:\llama.cpp\models 主模型與視覺投影組件 [mmproj]...
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
                
                REM 檢查該模型所屬目錄是否有對應架構的 mmproj 視覺投影
                set "has_mmproj_!count!=無"
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
                        set "has_mmproj_!count!=有 [%%~nxm]"
                    )
                )
                if "!has_mmproj_!count!"=="無" (
                    for /f "delims=" %%m in ('dir /b "%%~dpfmmproj*.gguf" 2^>nul') do (
                        set "has_mmproj_!count!=有 [%%~nxm]"
                    )
                )
                
                REM 標註 MTP 支援狀態
                set "mtp_tag_!count!=標準自回歸 (無 MTP 層)"
                echo !fname! | findstr /i "Qwen3.8 DeepSeek-V3 FastMTP MTP" >nul
                if not errorlevel 1 (
                    set "mtp_tag_!count!=原生 MTP (2.23x 加速)"
                )
            )
        )
    )
)

if %count%==0 (
    echo [錯誤] 找不到任何可用 GGUF 主模型，請確認 C:\llama.cpp\models 路徑。
    pause
    exit /b 1
)

echo ----------------------------------------------------------------------
echo 可載入的 GGUF 主模型清單:
echo ----------------------------------------------------------------------
for /l %%i in (1,1,%count%) do (
    echo   [%%i] !name_%%i!
    echo       ├─ 視覺投影: !has_mmproj_%%i!
    echo       └─ 加速特性: !mtp_tag_%%i!
    echo.
)
echo ----------------------------------------------------------------------

set /p choice="請輸入要載入的模型編號 [1-%count%, 直接按 Enter 預設載入 1]: "
if "!choice!"=="" set "choice=1"

if not defined file_%choice% (
    echo [錯誤] 輸入編號無效，已退出。
    pause
    exit /b 1
)

set "SELECTED_MODEL=!file_%choice%!"
set "MODEL_DIR=!dir_%choice%!"
set "MODEL_NAME=!name_%choice%!"

REM 自動定位配對 mmproj 視覺投影 (優先依架構家族精準配對)
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

REM 若無架構專屬匹配，則在當前目錄尋找任何 mmproj
if not defined MMPROJ_FILE (
    for /f "delims=" %%m in ('dir /b "!MODEL_DIR!mmproj*.gguf" 2^>nul') do (
        if not defined MMPROJ_FILE (
            set "MMPROJ_FILE=!MODEL_DIR!%%m"
            set "MMPROJ_NAME=%%~nxm"
            set "MMPROJ_ARG=--mmproj "!MODEL_DIR!%%m""
        )
    )
)

REM 若當前目錄無 mmproj，全目錄備援搜尋 (優先依架構)
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

REM 智慧架構與 MTP 加速判定 (僅 Qwen3.8 等原生內建 MTP 層之模型啟用)
set "MTP_ARG="
set "MTP_DESC="
echo !MODEL_NAME! | findstr /i "Qwen3.8 DeepSeek-V3 FastMTP MTP" >nul
if not errorlevel 1 (
    set "MTP_ARG=--spec-type draft-mtp"
    set "MTP_DESC=原生 Embedded MTP [雙倍極速 2.23x 加速，官方通用相容]"
) else (
    set "MTP_ARG="
    set "MTP_DESC=標準自回歸推理模式 [該模型無 MTP 層，已自動切換安全標準模式]"
)

cls
echo ======================================================================
echo           MiniMax-H3 AI Prompt Studio - llama.cpp 伺服器啟動中
echo ======================================================================
echo [*] 模型路徑: !SELECTED_MODEL!
if defined MMPROJ_NAME (
    echo [+] 視覺投影: !MMPROJ_NAME! [已自動精準配對掛載，支援多模態圖片/影片分析]
) else (
    echo [i] 視覺投影: 未偵測到相容 mmproj 投影檔 [純文字推理模式]
)
echo [+] 推理加速: !MTP_DESC!
echo [*] GPU 卸載: -ngl 99 [RTX 5090 32GB VRAM 全層載入]
echo [*] 加速技術: --flash-attn on, -c 32768 [32K 旗艦上下文]
echo [*] 連線端點: http://127.0.0.1:8080
echo ======================================================================
echo.

llama-server.exe -m "!SELECTED_MODEL!" !MMPROJ_ARG! !MTP_ARG! -ngl 99 --flash-attn on -c 32768 --host 127.0.0.1 --port 8080

pause
