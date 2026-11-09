@echo off
title The Mixing Vault - Beta Web Service (Port 3004)
cd /d "C:\Users\VM Servers\Downloads\Kerpbot2\Mixing Vault\Stem Vault Beta"
set PORT=3004

:loop
echo [%date% %time%] Starting The Mixing Vault Beta web service on port 3004...
call npx next start -p 3004
echo [%date% %time%] [WARNING] Next.js Beta exited with code %errorlevel%. Restarting in 3 seconds...
timeout /t 3 /nobreak >nul
goto loop
