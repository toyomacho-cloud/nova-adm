# 🚀 NOVA-ADM - Guía de Deployment a Vercel

## Pre-requisitos

1. **Cuenta Vercel**: https://vercel.com
2. **Vercel CLI**: `npm i -g vercel`
3. **Database PostgreSQL**: Vercel Postgres o Railway

---

## Paso 1: Preparar Base de Datos

### Opción A: Vercel Postgres (Recomendado)
1. En Vercel Dashboard → Storage → Create Database
2. Seleccionar "Postgres"
3. Copiar la `DATABASE_URL`

### Opción B: Railway
1. Ir a https://railway.app
2. New Project → PostgreSQL
3. Copiar la `DATABASE_URL`

---

## Paso 2: Configurar Variables de Entorno

En Vercel Dashboard → Project → Settings → Environment Variables:

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Auth
NEXTAUTH_URL=https://tu-dominio.vercel.app
NEXTAUTH_SECRET=genera-con-openssl-rand-base64-32

# BCV (opcional en staging)
BCV_ENABLED=true

# Cashea (opcional - agregar después)
CASHEA_API_KEY=
CASHEA_API_SECRET=
CASHEA_MERCHANT_ID=
CASHEA_ENV=sandbox

# PayPal (opcional - agregar después)
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_ENV=sandbox
```

---

## Paso 3: Deploy

### Opción 1: Deploy desde CLI (Rápido)

```bash
# Login a Vercel
vercel login

# Deploy a producción
vercel --prod

# Seguir los prompts:
# - Set up y link project? Y
# - Scope: tu-username
# - Link to existing project? N
# - Project name: nova-adm
# - Directory: ./
# - Override settings? N
```

### Opción 2: Deploy desde GitHub (Recomendado para futuro)

1. **Crear repo en GitHub:**
```bash
git init
git add .
git commit -m "Initial commit - NOVA-ADM v1.0"
git branch -M main
git remote add origin https://github.com/tu-usuario/nova-adm.git
git push -u origin main
```

2. **Conectar en Vercel:**
- Dashboard → New Project
- Import Git Repository
- Seleccionar nova-adm
- Configure:
  - Framework Preset: Next.js
  - Root Directory: ./
  - Build Command: `npx prisma generate && npm run build`
  - Install Command: `npm install`

3. **Deploy automático:**
- Cada push a `main` = deploy automático

---

## Paso 4: Migraciones de Base de Datos

Una vez deployado, ejecutar migraciones:

```bash
# Opción 1: Desde CLI local
DATABASE_URL="tu-postgres-url" npx prisma db push

# Opción 2: Desde Vercel (Build Command)
# Ya incluido en vercel.json: npx prisma generate
```

---

## Paso 5: Verificar Deployment

1. Abrir URL de Vercel
2. Verificar que carga la página
3. Registrar usuario de prueba
4. Probar módulo de ventas

---

## Post-Deployment

### Crear Usuario Admin Inicial

Opción 1 - Desde Prisma Studio:
```bash
DATABASE_URL="postgres-url" npx prisma studio
```

Opción 2 - Desde la app:
1. Ir a `/auth/register`
2. Crear primer usuario
3. En DB, cambiar role a "ADMIN"

### Crear Empresa/Company

```sql
INSERT INTO Company (id, name, rif, isActive, ivaRate) 
VALUES ('company-1', 'Mi Empresa', 'J-12345678-9', true, 16.0);
```

### Actualizar Usuario con companyId

```sql
UPDATE User 
SET companyId = 'company-1' 
WHERE email = 'tu@email.com';
```

---

## Configuración Adicional

### Custom Domain (Opcional)
1. Vercel → Settings → Domains
2. Add domain
3. Configurar DNS según instrucciones

### Environment Variables por Entorno

**Production:**
- Cashea PRODUCTION keys
- PayPal PRODUCTION keys
- NEXTAUTH_SECRET único y seguro

**Preview (branches):**
- Sandbox keys
- Test databases

---

## Monitoreo

### Vercel Analytics
- Dashboard → Analytics
- Monitorear:
  - Page views
  - Performance
  - Errors

### Logs
- Dashboard → Deployments → View Function Logs
- Monitoring real-time errors

---

## Troubleshooting

### Error: Prisma Client not found
**Solución:** Agregar a `package.json`:
```json
"scripts": {
  "postinstall": "prisma generate"
}
```

### Error: Database connection
**Solución:** Verificar DATABASE_URL en Environment Variables

### Error 500 en producción
**Solución:** Ver logs en Vercel Dashboard → Functions

---

## Backup Automático

### Configurar en Railway/Vercel Postgres:
1. Enable automated backups
2. Retention: 7 días
3. Download manual backup semanal

---

## 🎯 Checklist Final

Antes de ir a producción:

- [ ] Database PostgreSQL configurada
- [ ] Variables de entorno en Vercel
- [ ] Deploy exitoso
- [ ] Migraciones ejecutadas
- [ ] Usuario admin creado
- [ ] Company creada
- [ ] Testing básico completado
- [ ] Cashea keys (si aplica)
- [ ] PayPal keys (si aplica)
- [ ] Custom domain (opcional)
- [ ] Monitoring configurado

---

## Comandos Útiles

```bash
# Ver deployments
vercel ls

# Ver logs en tiempo real
vercel logs

# Promover deployment a producción
vercel --prod

# Rollback a deployment anterior
vercel rollback

# Ver environment variables
vercel env ls

# Agregar environment variable
vercel env add DATABASE_URL
```

---

## 📞 Soporte

Si hay errores durante el deploy:
1. Revisar logs en Vercel Dashboard
2. Verificar build output
3. Confirmar environment variables
4. Verificar conexión a database

---

¡Deploy completado exitosamente! 🎉
