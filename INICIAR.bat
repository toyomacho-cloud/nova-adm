@echo off
echo ========================================
echo   NOVA-ADM - Inicio Automatico
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Verificando dependencias...
if not exist "node_modules" (
    echo Instalando paquetes por primera vez...
    call npm install
)

echo.
echo [2/4] Generando cliente de base de datos...
call npx prisma generate

echo.
echo [3/4] Sincronizando base de datos...
call npx prisma db push

echo.
echo [4/4] Iniciando servidor de desarrollo...
echo.
echo ========================================
echo   NOVA-ADM corriendo en:
echo   http://localhost:3000
echo.
echo   Presiona Ctrl+C para detener
echo ========================================
echo.

call npm run dev
