@echo off
title The Mixing Vault - Production Web Service (Port 3002)
cd /d "C:\Users\VM Servers\Downloads\Kerpbot2\Mixing Vault\Stem Vault"
set PORT=3002

:loop
echo [%date% %time%] Starting The Mixing Vault web service on port 3002...
call npx next start -p 3002
echo [%date% %time%] [WARNING] Next.js exited with code %errorlevel%. Restarting in 3 seconds...
timeout /t 3 /nobreak >nul
goto loop
