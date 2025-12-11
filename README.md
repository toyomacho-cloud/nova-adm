# NOVA-ADM - Sistema Administrativo

Sistema administrativo y contable integral diseñado específicamente para empresas venezolanas, con cumplimiento total de normativas SENIAT y alcaldías.

## 🚀 Características Principales

### Multi-Empresa (SaaS)
- Gestión de múltiples empresas desde una sola plataforma
- Datos completamente aislados por empresa
- Alta escalabilidad para soportar alto tráfico

### Módulos Implementados

#### ✅ Caja
- Apertura y cierre de caja
- Control de ingresos y egresos
- Conciliación de efectivo
- Múltiples métodos de pago

#### ✅ Libros Contables
- **Libro de Ventas**: Registro completo de facturas emitidas
- **Libro de Compras**: Control de facturas de proveedores
- Cálculo automático de IVA
- Exportación para declaraciones

#### ✅ Retenciones Fiscales
- **Retenciones de IVA**: Gestión según normativa SENIAT
- **Retenciones de ISLR**: Cálculo de retenciones de impuesto sobre la renta
- **Retenciones Municipales**: Comprobantes para alcaldías
- Exportación en formato TXT y XML

#### ✅ Cuentas por Cobrar/Pagar
- Antigüedad de saldos
- Seguimiento de pagos
- Recordatorios automáticos
- Proyecciones de flujo de caja

#### ✅ Configuración
- Gestión de empresas y RIF
- Métodos de pago personalizables
- Contribuyentes especiales
- Múltiples usuarios con roles

## 🎨 Diseño

- **UI Moderna y Atractiva**: Diseño con glassmorphism, gradientes vibrantes y animaciones suaves
- **UX Intuitiva**: Interfaz predictiva con autocompletado y sugerencias inteligentes
- **Responsive**: Funciona perfectamente en desktop, tablet y móvil
- **PWA**: Instalable como aplicación nativa en dispositivos móviles
- **Dark Mode**: Soporte completo para modo oscuro

## 🛠️ Tecnología

- **Frontend**: Next.js 14 con App Router
- **TypeScript**: Tipado fuerte para mayor confiabilidad
- **Styling**: Tailwind CSS con tema personalizado venezolano
- **Database**: PostgreSQL con Prisma ORM
- **Authentication**: NextAuth.js
- **UI Components**: Componentes reutilizables personalizados

## 📋 Requisitos

- Node.js 18+ 
- PostgreSQL 14+
- npm o yarn

## 🚀 Instalación

1. **Instalar Node.js si no lo tienes:**
   - Descarga desde [nodejs.org](https://nodejs.org/)
   - Verifica la instalación: `node --version`

2. **Clonar o navegar al proyecto:**
   ```bash
   cd C:\Users\LUIS\.gemini\antigravity\scratch\nova-adm
   ```

3. **Instalar dependencias:**
   ```bash
   npm install
   ```

4. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   ```
   Edita `.env` y configura la conexión a tu base de datos PostgreSQL.

5. **Configurar la base de datos:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

6. **Ejecutar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

7. **Abrir en el navegador:**
   - Navega a [http://localhost:3000](http://localhost:3000)

## 📱 Uso como PWA en Móvil

1. Abre la aplicación en tu navegador móvil
2. En Chrome/Edge: Toca el menú → "Agregar a pantalla de inicio"
3. En Safari: Toca compartir → "Agregar a pantalla de inicio"
4. La app se instalará como una aplicación nativa

## 📊 Cumplimiento Legal Venezuela

- ✅ Formato de archivos TXT según especificaciones SENIAT
- ✅ Generación de XML para retenciones electrónicas
- ✅ Validación de RIF (Registro de Información Fiscal)
- ✅ Cálculo de IVA al 16%
- ✅ Retenciones de IVA (75% y 100%)
- ✅ Retenciones de ISLR según tarifas vigentes
- ✅ Comprobantes de retención municipales
- ✅ Soporte para contribuyentes especiales

## 🗂️ Estructura del Proyecto

```
nova-adm/
├── prisma/
│   └── schema.prisma          # Esquema de base de datos
├── public/
│   └── manifest.json          # PWA manifest
├── src/
│   ├── app/
│   │   ├── auth/              # Autenticación
│   │   ├── dashboard/         # Panel principal
│   │   │   ├── caja/          # Módulo de caja
│   │   │   ├── ventas/        # Libro de ventas
│   │   │   ├── compras/       # Libro de compras
│   │   │   ├── retenciones/   # Retenciones fiscales
│   │   │   └── ...
│   │   └── globals.css        # Estilos globales
│   ├── components/
│   │   └── ui/                # Componentes reutilizables
│   └── lib/
│       ├── utils.ts           # Utilidades y helpers
│       └── prisma.ts          # Cliente Prisma
├── package.json
└── README.md
```

## 🔐 Seguridad

- Autenticación robusta con NextAuth.js
- Aislamiento de datos por empresa (multi-tenant)
- Validación de datos en cliente y servidor
- Protección contra inyección SQL con Prisma
- Sesiones encriptadas

## 📈 Escalabilidad

- Arquitectura multi-tenant optimizada
- Índices de base de datos para consultas rápidas
- Caché de consultas frecuentes
- Optimización de assets y código
- Preparado para despliegue en cloud (Vercel, AWS, etc.)

## 🎯 Roadmap Futuro

- [ ] Integración con pasarelas de pago venezolanas
- [ ] Reportes avanzados con gráficos
- [ ] Exportación a Excel avanzada
- [ ] Módulo de inventario
- [ ] Módulo de nómina
- [ ] API REST para integraciones
- [ ] Notificaciones por email/SMS

## 📞 Soporte

Para soporte o consultas sobre el sistema, contacta al administrador del proyecto.

## 📄 Licencia

Este proyecto está desarrollado para uso empresarial privado.

---

**Hecho con ❤️ para Venezuela 🇻🇪**
