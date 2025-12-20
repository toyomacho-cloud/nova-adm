@echo off
REM ============================================
REM SISTEMA DE RESPALDO AUTOMÁTICO DIARIO
REM NOVA-ADM - Backup Script
REM ============================================

echo.
echo ========================================
echo   RESPALDO DIARIO - NOVA-ADM
echo ========================================
echo.

REM Obtener fecha actual
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set FECHA=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%
set HORA=%datetime:~8,2%-%datetime:~10,2%

echo Fecha: %FECHA%
echo Hora: %HORA%
echo.

REM Verificar si git está inicializado
if not exist ".git" (
    echo [INFO] Inicializando repositorio Git...
    git init
    git add .
    git commit -m "Initial commit - NOVA-ADM"
    echo.
)

REM Agregar todos los cambios
echo [1/4] Agregando archivos modificados...
git add .

REM Verificar si hay cambios
git diff --cached --quiet
if %errorlevel% equ 0 (
    echo.
    echo [INFO] No hay cambios para respaldar.
    echo.
    goto :fin
)

REM Commit con mensaje automático
echo [2/4] Creando commit de respaldo...
git commit -m "Backup automatico - %FECHA% %HORA%"

REM Mostrar estadísticas
echo.
echo [3/4] Estadisticas del respaldo:
git log -1 --stat

REM Crear tag del día
echo.
echo [4/4] Creando tag del respaldo...
git tag -f "backup-%FECHA%" -m "Respaldo automatico del %FECHA%"

echo.
echo ========================================
echo   RESPALDO COMPLETADO EXITOSAMENTE
echo ========================================
echo.
echo Commit creado: Backup automatico - %FECHA% %HORA%
echo Tag creado: backup-%FECHA%
echo.
echo Para ver el historial: git log
echo Para ver tags: git tag -l
echo Para restaurar: git checkout backup-YYYY-MM-DD
echo.

:fin
pause
