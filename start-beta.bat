@echo off
setlocal enabledelayedexpansion
title The Mixing Vault - Beta UI Service (Port 3003)

cd /d "%~dp0"
echo =========================================================
echo   The Mixing Vault - Liquid Glass Beta UI (Port 3003)
echo =========================================================
echo.

set PORT=3003
set NEXT_PUBLIC_IS_BETA=true

echo Starting Next.js Beta Service on port 3003...
npx next start -p 3003
