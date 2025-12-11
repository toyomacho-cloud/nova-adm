@echo off
echo ========================================
echo NOVA-ADM - Subir a GitHub
echo ========================================
echo.

set /p GITHUB_USER="Ingresa tu usuario de GitHub: "

cd /d C:\Users\LUIS\.gemini\antigravity\scratch\nova-adm

git remote add origin https://github.com/%GITHUB_USER%/nova-adm.git
git branch -M main
git push -u origin main

echo.
echo ========================================
echo LISTO! Proyecto en GitHub
echo.
echo Ahora ve a:
echo https://vercel.com/signup
echo.
echo 1. Continue with GitHub
echo 2. Autoriza Vercel
echo 3. Import Project = nova-adm
echo 4. Deploy
echo.
echo Tu sitio estara en: https://nova-adm-xxx.vercel.app
echo ========================================
pause
