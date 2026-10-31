@echo off
cd /d "C:\Users\VM Servers\Downloads\Kerpbot2\Mixing Vault\Stem Vault"
set PORT=3002
call npx next start -p 3002 >> "C:\Users\VM Servers\Downloads\Kerpbot2\Mixing Vault\Stem Vault\app-startup.log" 2>&1
