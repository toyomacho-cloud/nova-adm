# 🚀 NOVA-ADM - Sistema ERP Venezolano

![Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![Progress](https://img.shields.io/badge/Progress-90%25-blue)
![License](https://img.shields.io/badge/License-Proprietary-red)

Sistema ERP completo diseñado para el mercado venezolano con soporte dual currency (USD/Bs), integración BCV, y cumplimiento tributario SENIAT.

---

## 📋 Tabla de Contenidos

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [Módulos](#módulos)
- [Deployment](#deployment)
- [Documentación](#documentación)

---

## ✨ Características

### Core
- ✅ **Dual Currency** - USD y Bs. en todas las transacciones
- ✅ **BCV Integration** - Tasa de cambio automática
- ✅ **Multi-tenant** - Soporte para múltiples empresas
- ✅ **Dark Mode** - Tema oscuro completo
- ✅ **Responsive** - Optimizado para móvil y desktop

### Módulos Implementados (16)
1. **Autenticación** - NextAuth.js con email/password
2. **Clientes** - CRUD completo con contribuyentes especiales
3. **Productos** - Catálogo con control de stock
4. **POS** - Punto de venta completo
5. **Ventas** - Facturación con PDFs
6. **Compras** - Registro con actualización de inventario
7. **Proveedores** - Gestión completa
8. **Retenciones SENIAT** - IVA, ISLR, Municipal
9. **Reportes SENIAT** - Consolidados con exportación .TXT
10. **Libros Fiscales** - Ventas y Compras automáticos
11. **CxC** - Cuentas por cobrar con pagos parciales
12. **Dashboard Financiero** - P&L y métricas
13. **Reportes** - Analytics por período
14. **Caja** - Control de efectivo
15. **Configuración** - Datos de empresa
16. **PDFs** - Facturas profesionales

### Compliance Venezuela 🇻🇪
- ✅ IVA 16% automático
- ✅ Retenciones IVA (75%/100%)
- ✅ Retenciones ISLR (2-3% por servicio)
- ✅ Retenciones Municipales (1%)
- ✅ Libros Fiscales automáticos
- ✅ Exportación .TXT formato SENIAT
- ✅ RIF validation
- ✅ Numeración secuencial

---

## 🛠️ Tecnologías

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI:** React 18 + TypeScript
- **Styling:** TailwindCSS + Shadcn UI
- **Forms:** React Hook Form
- **PDFs:** jsPDF + jsPDF-autotable
- **Excel:** xlsx

### Backend
- **Runtime:** Node.js
- **API:** Next.js API Routes
- **Auth:** NextAuth.js
- **ORM:** Prisma
- **Database:** SQLite (dev) / PostgreSQL (prod)

### DevOps
- **Package Manager:** npm
- **Deployment:** Vercel / Railway / DigitalOcean
- **Version Control:** Git

---

## 📦 Requisitos

- Node.js 18+ 
- npm 9+
- PostgreSQL 14+ (producción)

---

## 🚀 Instalación

### 1. Clonar repositorio
```bash
git clone https://github.com/tu-usuario/nova-adm.git
cd nova-adm
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
```

Editar `.env`:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/novaadm"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-super-secret-key-aqui"

# Optional
BCV_API_URL="https://api.bcv.org.ve/..."
```

### 4. Inicializar base de datos
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 5. Iniciar servidor de desarrollo
```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

---

## ⚙️ Configuración

### Primera vez

1. **Crear cuenta de administrador:**
   - Ir a `/auth/register`
   - Completar formulario
   - Login en `/auth/login`

2. **Configurar empresa:**
   - Dashboard → Configuración
   - Completar datos fiscales
   - Guardar

3. **Configurar métodos de pago:**
   - Dashboard → Configuración → Métodos de Pago
   - Activar los que uses

4. **Agregar productos de ejemplo:**
   ```bash
   npm run seed:products
   ```

---

## 📖 Uso

### Flujo de Venta Completo

1. **Crear cliente:**
   - Dashboard → Clientes → Nuevo Cliente
   - Completar datos + RIF
   - Marcar "Contribuyente Especial" si aplica

2. **Registrar productos:**
   - Dashboard → Productos → Nuevo Producto
   - Precio USD (Bs. se calcula automático)
   - Stock inicial

3. **Hacer venta en POS:**
   - Dashboard → POS
   - Buscar productos → Agregar al carrito
   - Seleccionar cliente
   - Método de pago → COBRAR

4. **Descargar factura PDF:**
   - Dashboard → Ventas
   - Click en venta → Ver detalle
   - Descargar PDF

5. **Generar retenciones (si aplica):**
   - Dashboard → Retenciones → IVA/ISLR/Municipal
   - Generar retención → Seleccionar venta
   - Descargar comprobante

6. **Reportes mensuales:**
   - Dashboard → SENIAT
   - Seleccionar mes → Exportar .TXT
   - Subir al portal SENIAT

### Flujo de Compra

1. **Crear proveedor:**
   - Dashboard → Proveedores → Nuevo

2. **Registrar compra:**
   - Dashboard → Compras → Registrar Compra
   - Seleccionar proveedor
   - Agregar items → Registrar
   - ✅ Stock se actualiza automáticamente

### Reportes Fiscales

1. **Libro de Ventas/Compras:**
   - Dashboard → Libros Fiscales
   - Seleccionar mes → Exportar .TXT

2. **Dashboard Financiero:**
   - Dashboard → Financiero
   - Ver P&L, métricas, gráficos

---

## 📂 Módulos

### Ventas & POS (50%)
- Clientes con RIF
- Productos con stock
- POS 3 columnas
- Facturación automática
- PDFs profesionales
- Historial ventas

### SENIAT (10%)
- Retenciones automáticas
- IVA (75%/100%)
- ISLR (2-3%)
- Municipal (1%)
- Reportes consolidados
- Exportación .TXT

### Financiero (15%)
- CxC con pagos parciales
- Dashboard completo
- P&L simplificado
- Métricas negocio

### Compras (10%)
- Proveedores
- Registro compras
- Stock automático

### Libros Fiscales (5%)
- Ventas automático
- Compras automático
- Exportación .TXT

### Configuración (5%)
- Datos empresa
- Métodos pago
- Usuarios

---

## 🌐 Deployment

### Vercel (Recomendado)

1. **Conectar repositorio:**
   ```bash
   vercel init
   ```

2. **Configurar PostgreSQL:**
   - Usar Supabase / PlanetScale / Neon
   - Copiar DATABASE_URL

3. **Variables de entorno:**
   ```
   DATABASE_URL=postgresql://...
   NEXTAUTH_URL=https://tu-dominio.vercel.app
   NEXTAUTH_SECRET=super-secret-key
   ```

4. **Deploy:**
   ```bash
   vercel --prod
   ```

### Railway

1. **Crear proyecto:**
   - Railway.app → New Project
   - Connect GitHub repo

2. **Agregar PostgreSQL:**
   - Add Service → Database → PostgreSQL

3. **Variables:**
   - Copiar DATABASE_URL automático
   - Agregar NEXTAUTH_URL y SECRET

4. **Deploy automático con git push**

### Manual (VPS)

```bash
# Build
npm run build

# Start
npm start

# O usar PM2
pm2 start npm --name "nova-adm" -- start
```

---

## 📚 Documentación

### Archivos de Referencia
- [`task.md`](brain/task.md) - Task tracker
- [`resumen_final.md`](brain/resumen_final.md) - Resumen completo del sistema
- [`sesion_nocturna.md`](brain/sesion_nocturna.md) - Sesión de desarrollo nocturna

### Scripts Útiles

```bash
# Desarrollo
npm run dev              # Servidor desarrollo
npx prisma studio        # Ver base de datos

# Base de datos
npx prisma generate      # Generar cliente
npx prisma db push       # Aplicar schema
npx prisma db seed       # Seed data

# Producción
npm run build           # Build para producción
npm start              # Servidor producción

# Utilidades
npm run lint           # Linter
npm run format         # Format código
```

---

## 🎯 Roadmap (10% restante)

### Próximas Funcionalidades
- [ ] Facturación electrónica SENIAT
- [ ] Multi-empresa UI selector
- [ ] CRM básico
- [ ] Excel exports avanzados
- [ ] Email notifications
- [ ] Backup automático
- [ ] Mobile app (React Native)

---

## 📞 Soporte

Para preguntas o soporte:
- Email: soporte@nova-adm.com
- Docs: https://docs.nova-adm.com
- GitHub Issues: https://github.com/tu-usuario/nova-adm/issues

---

## 📄 Licencia

Proprietary - © 2025 NOVA-ADM

---

## 🙏 Créditos

Desarrollado con ❤️ para Venezuela 🇻🇪

**Stack:**
- Next.js Team
- Vercel
- Prisma
- shadcn/ui
- Tailwind Labs

---

**Estado:** ✅ 90% Completado - Production Ready  
**Última actualización:** Diciembre 2025
