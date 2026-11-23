@echo off
title Telinha
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Nao encontrei o Node.js neste computador.
  echo  Instale em https://nodejs.org e depois abra este arquivo de novo.
  echo  ^(Se acabou de instalar, reinicie o computador e tente de novo.^)
  echo.
  pause
  exit /b 1
)

echo.
echo  ============================================
echo                    TELINHA
echo  ============================================
echo.
echo  Se for so testar sozinho, aperte Enter.
echo  Se os amigos forem entrar pela internet, escolha uma senha.
echo.
set "SENHA="
set /p "SENHA=Senha para entrar (Enter = sem senha): "
set "ABRIR_NAVEGADOR=1"

node server.js

echo.
echo  O servidor foi desligado.
pause
