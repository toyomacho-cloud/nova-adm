@echo off
echo Cerrando Prisma Studio y regenerando cliente...

REM Kill Prisma Studio
taskkill /F /IM node.exe /FI "WINDOWTITLE eq Prisma Studio*" 2>nul

echo Esperando 2 segundos...
timeout /t 2 /nobreak >nul

echo Regenerando cliente de Prisma...
call npx prisma generate

echo.
echo Aplicando cambios a la base de datos...
call npx prisma db push

echo.
echo Listo! Base de datos actualizada.
pause
