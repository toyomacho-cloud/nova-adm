import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from './auth'
import type { Cargo } from './cargos'
import { verificarPermiso, getNombreCargo } from './cargos'

/**
 * Middleware/wrapper para proteger rutas API según el cargo del usuario
 * Equivalente TypeScript del decorador Python @requerir_cargo
 * 
 * @example
 * // En una ruta API:
 * export async function POST(request: Request) {
 *   return withCargo(['PRESIDENTE', 'ADMINISTRADOR'], async (session) => {
 *     // Tu lógica aquí - solo se ejecuta si el usuario tiene el cargo permitido
 *     return NextResponse.json({ success: true })
 *   })
 * }
 */
export async function withCargo(
    cargosPermitidos: Cargo[],
    handler: (session: any) => Promise<NextResponse>
): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'No autenticado. Por favor inicia sesión.' },
                { status: 401 }
            )
        }

        const cargoUsuario = session.user.role as Cargo

        if (!cargosPermitidos.includes(cargoUsuario)) {
            const nombreCargo = getNombreCargo(cargoUsuario)
            return NextResponse.json(
                {
                    error: `Acceso denegado. Tu cargo de ${nombreCargo} no permite esta acción.`,
                    cargoRequerido: cargosPermitidos.map(getNombreCargo).join(', '),
                    cargoActual: nombreCargo,
                },
                { status: 403 }
            )
        }

        return await handler(session)
    } catch (error) {
        console.error('Error en withCargo:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

/**
 * Verifica si el usuario actual tiene permiso para una ruta específica
 * Útil para verificaciones del lado del servidor en Server Components
 */
export async function verificarAccesoRuta(ruta: string): Promise<{
    permitido: boolean
    cargo?: Cargo
    mensaje?: string
}> {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return {
            permitido: false,
            mensaje: 'No autenticado',
        }
    }

    const cargo = session.user.role as Cargo
    const permitido = verificarPermiso(cargo, ruta)

    return {
        permitido,
        cargo,
        mensaje: permitido ? undefined : `Tu cargo de ${getNombreCargo(cargo)} no tiene acceso a esta sección.`,
    }
}

/**
 * Higher-order function para crear handlers protegidos
 * Versión más funcional similar al decorador Python
 */
export function requerirCargo(cargosPermitidos: Cargo[]) {
    return function <T extends (...args: any[]) => Promise<NextResponse>>(handler: T) {
        return async function (...args: Parameters<T>): Promise<NextResponse> {
            return withCargo(cargosPermitidos, async (session) => {
                return handler(...args)
            })
        }
    }
}
