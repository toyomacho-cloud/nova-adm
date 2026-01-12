/**
 * Sistema de Cargos y Permisos para NOVA-ADM
 * Basado en la estructura empresarial venezolana
 */

// Tipos de cargo disponibles en el sistema
export type Cargo =
    | 'PRESIDENTE'
    | 'ADMINISTRADOR'
    | 'VENDEDOR'
    | 'CAJERA'
    | 'ALMACENISTA'
    | 'ASISTENTE';

// Información descriptiva de cada cargo
export const CARGO_INFO: Record<Cargo, { nombre: string; descripcion: string; color: string }> = {
    PRESIDENTE: {
        nombre: 'Presidente',
        descripcion: 'Acceso total al sistema, gestión de usuarios y configuración general',
        color: 'danger', // Rojo para máxima autoridad
    },
    ADMINISTRADOR: {
        nombre: 'Administrador',
        descripcion: 'Gestión general, ventas, compras, inventario y reportes',
        color: 'info',
    },
    VENDEDOR: {
        nombre: 'Vendedor',
        descripcion: 'Punto de venta, gestión de clientes y consulta de inventario',
        color: 'success',
    },
    CAJERA: {
        nombre: 'Cajera',
        descripcion: 'Gestión de caja, cobros y punto de venta',
        color: 'warning',
    },
    ALMACENISTA: {
        nombre: 'Almacenista',
        descripcion: 'Control de inventario, productos y movimientos de stock',
        color: 'secondary',
    },
    ASISTENTE: {
        nombre: 'Asistente Administrativo',
        descripcion: 'Visualización de reportes y funciones de soporte',
        color: 'default',
    },
};

// Lista de cargos para usar en selects
export const CARGOS_LIST = Object.entries(CARGO_INFO).map(([value, info]) => ({
    value: value as Cargo,
    label: info.nombre,
    descripcion: info.descripcion,
    color: info.color,
}));

// Rutas base del sistema
const RUTAS = {
    DASHBOARD: '/dashboard',
    // Contactos
    CLIENTES: '/dashboard/clientes',
    PROVEEDORES: '/dashboard/proveedores',
    // Inventario
    PRODUCTOS: '/dashboard/inventario/productos',
    MOVIMIENTOS: '/dashboard/inventario/movimientos',
    VERIFICACION: '/dashboard/inventario/verificacion',
    // Ventas
    POS: '/dashboard/punto-de-venta',
    TARIFA: '/dashboard/ventas/tarifa',
    CAJA: '/dashboard/caja',
    LIBRO_VENTAS: '/dashboard/ventas',
    // Compras
    COMPRAS: '/dashboard/compras',
    NUEVA_COMPRA: '/dashboard/compras/nueva',
    // Retenciones
    RETENCIONES_IVA: '/dashboard/retenciones/iva',
    RETENCIONES_ISLR: '/dashboard/retenciones/islr',
    RETENCIONES_MUNICIPAL: '/dashboard/retenciones/municipal',
    SENIAT: '/dashboard/seniat',
    // Otros
    REPORTES: '/dashboard/reportes',
    FINANCIERO: '/dashboard/financiero',
    CUENTAS_COBRAR: '/dashboard/cuentas-por-cobrar',
    CUENTAS_PAGAR: '/dashboard/cuentas-por-pagar',
    LIBROS_FISCALES: '/dashboard/libros-fiscales',
    CASHEA: '/dashboard/cashea',
    // Configuración
    CONFIGURACION: '/dashboard/configuracion',
    USUARIOS: '/dashboard/configuracion/usuarios',
    METODOS_PAGO: '/dashboard/configuracion/metodos-pago',
    CONTRIBUYENTES: '/dashboard/configuracion/contribuyentes-especiales',
} as const;

// Permisos por cargo - qué rutas puede acceder cada cargo
export const PERMISOS_POR_CARGO: Record<Cargo, string[]> = {
    PRESIDENTE: [
        // Acceso total
        ...Object.values(RUTAS),
    ],
    ADMINISTRADOR: [
        RUTAS.DASHBOARD,
        // Contactos
        RUTAS.CLIENTES,
        RUTAS.PROVEEDORES,
        // Inventario
        RUTAS.PRODUCTOS,
        RUTAS.MOVIMIENTOS,
        RUTAS.VERIFICACION,
        // Ventas
        RUTAS.POS,
        RUTAS.TARIFA,
        RUTAS.CAJA,
        RUTAS.LIBRO_VENTAS,
        // Compras
        RUTAS.COMPRAS,
        RUTAS.NUEVA_COMPRA,
        // Reportes
        RUTAS.REPORTES,
        RUTAS.FINANCIERO,
        RUTAS.CUENTAS_COBRAR,
        RUTAS.CUENTAS_PAGAR,
        // Configuración (solo empresa y métodos de pago)
        RUTAS.CONFIGURACION,
        RUTAS.METODOS_PAGO,
    ],
    VENDEDOR: [
        RUTAS.DASHBOARD,
        RUTAS.POS,
        RUTAS.CLIENTES,
        RUTAS.PRODUCTOS, // Solo lectura
        RUTAS.TARIFA,
    ],
    CAJERA: [
        RUTAS.DASHBOARD,
        RUTAS.POS,
        RUTAS.CAJA,
        RUTAS.LIBRO_VENTAS,
    ],
    ALMACENISTA: [
        RUTAS.DASHBOARD,
        RUTAS.PRODUCTOS,
        RUTAS.MOVIMIENTOS,
        RUTAS.VERIFICACION,
    ],
    ASISTENTE: [
        RUTAS.DASHBOARD,
        RUTAS.REPORTES,
        RUTAS.CLIENTES, // Solo lectura
        RUTAS.PRODUCTOS, // Solo lectura
    ],
};

/**
 * Verifica si un cargo tiene permiso para acceder a una ruta
 * @param cargo - El cargo del usuario
 * @param ruta - La ruta a verificar
 * @returns true si tiene permiso, false si no
 */
export function verificarPermiso(cargo: Cargo, ruta: string): boolean {
    const permisosDelCargo = PERMISOS_POR_CARGO[cargo];

    if (!permisosDelCargo) {
        return false;
    }

    // Verificar coincidencia exacta o si la ruta comienza con alguna ruta permitida
    return permisosDelCargo.some(rutaPermitida =>
        ruta === rutaPermitida || ruta.startsWith(rutaPermitida + '/')
    );
}

/**
 * Obtiene el nombre legible del cargo
 */
export function getNombreCargo(cargo: Cargo): string {
    return CARGO_INFO[cargo]?.nombre || cargo;
}

/**
 * Obtiene el color del badge para el cargo
 */
export function getColorCargo(cargo: Cargo): string {
    return CARGO_INFO[cargo]?.color || 'default';
}

/**
 * Filtra la navegación según el cargo del usuario
 * @param navegacion - Array de items de navegación
 * @param cargo - El cargo del usuario
 * @returns Navegación filtrada
 */
export function filtrarNavegacionPorCargo<T extends { href: string; children?: { href: string }[] }>(
    navegacion: T[],
    cargo: Cargo
): T[] {
    return navegacion
        .map(item => {
            // Si tiene hijos, filtrarlos también
            if (item.children) {
                const hijosPermitidos = item.children.filter(child =>
                    verificarPermiso(cargo, child.href)
                );

                // Si no quedan hijos permitidos, no mostrar el padre
                if (hijosPermitidos.length === 0) {
                    return null;
                }

                return {
                    ...item,
                    children: hijosPermitidos,
                };
            }

            // Item sin hijos - verificar permiso directo
            if (!verificarPermiso(cargo, item.href)) {
                return null;
            }

            return item;
        })
        .filter((item): item is T => item !== null);
}
