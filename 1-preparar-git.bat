@echo off
echo ========================================
echo NOVA-ADM - Preparando Deploy a Vercel
echo ========================================
echo.

REM Configurar Git con tu email
git config --global user.name "Luis"
git config --global user.email "luisar2ro@gmail.com"

echo [1/5] Git configurado con tu email
echo.

REM Ir a la carpeta del proyecto
cd /d C:\Users\LUIS\.gemini\antigravity\scratch\nova-adm

echo [2/5] En carpeta del proyecto
echo.

REM Inicializar Git
git init

echo [3/5] Git inicializado
echo.

REM Agregar todos los archivos
git add .

echo [4/5] Archivos agregados
echo.

REM Hacer commit
git commit -m "Initial commit: NOVA-ADM Sistema Administrativo"

echo [5/5] Commit realizado
echo.
echo ========================================
echo LISTO! Ahora ve a GitHub:
echo 1. https://github.com/new
echo 2. Repository name: nova-adm
echo 3. NO marques nada
echo 4. Create repository
echo.
echo Luego ejecuta: 2-subir-github.bat
echo ========================================
pause
