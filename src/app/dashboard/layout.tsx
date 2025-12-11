'use client'

import { useState, ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    DollarSign,
    ShoppingCart,
    FileText,
    Receipt,
    CreditCard,
    TrendingUp,
    TrendingDown,
    Settings,
    Menu,
    X,
    Building,
    LogOut,
    User,
    ChevronDown,
    Moon,
    Sun,
    Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    {
        name: 'Caja',
        href: '/dashboard/caja',
        icon: DollarSign,
        children: [
            { name: 'Movimientos', href: '/dashboard/caja' },
            { name: 'Conciliación', href: '/dashboard/caja/reconciliacion' },
        ]
    },
    {
        name: 'Ventas',
        href: '/dashboard/ventas',
        icon: ShoppingCart,
        children: [
            { name: 'Libro de Ventas', href: '/dashboard/ventas' },
            { name: 'Nueva Venta', href: '/dashboard/ventas/nueva' },
        ]
    },
    {
        name: 'Compras',
        href: '/dashboard/compras',
        icon: FileText,
        children: [
            { name: 'Libro de Compras', href: '/dashboard/compras' },
            { name: 'Nueva Compra', href: '/dashboard/compras/nueva' },
        ]
    },
    {
        name: 'Retenciones',
        href: '/dashboard/retenciones',
        icon: Receipt,
        children: [
            { name: 'IVA', href: '/dashboard/retenciones/iva' },
            { name: 'ISLR', href: '/dashboard/retenciones/islr' },
            { name: 'Municipales', href: '/dashboard/retenciones/municipal' },
        ]
    },
    {
        name: 'Cuentas por Cobrar',
        href: '/dashboard/cuentas-por-cobrar',
        icon: TrendingUp
    },
    {
        name: 'Cuentas por Pagar',
        href: '/dashboard/cuentas-por-pagar',
        icon: TrendingDown
    },
    {
        name: 'Configuración',
        href: '/dashboard/configuracion',
        icon: Settings,
        children: [
            { name: 'Empresa', href: '/dashboard/configuracion' },
            { name: 'Usuarios', href: '/dashboard/configuracion/usuarios' },
            { name: 'Métodos de Pago', href: '/dashboard/configuracion/metodos-pago' },
            { name: 'Contribuyentes Especiales', href: '/dashboard/configuracion/contribuyentes-especiales' },
        ]
    },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [darkMode, setDarkMode] = useState(false)
    const pathname = usePathname()

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Mobile sidebar */}
            <div className={cn(
                'fixed inset-0 z-50 lg:hidden',
                sidebarOpen ? 'block' : 'hidden'
            )}>
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />

                <div className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-gray-800 shadow-xl">
                    <Sidebar pathname={pathname} onClose={() => setSidebarOpen(false)} />
                </div>
            </div>

            {/* Desktop sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
                <Sidebar pathname={pathname} />
            </div>

            {/* Main content */}
            <div className="lg:pl-72">
                {/* Top bar */}
                <div className="sticky top-0 z-40 glass-card border-b border-gray-200 dark:border-gray-700">
                    <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        {/* Company selector */}
                        <div className="flex-1 flex items-center gap-3">
                            <Building className="w-5 h-5 text-primary-600" />
                            <button className="flex items-center gap-2 text-left">
                                <div>
                                    <div className="font-semibold text-sm">Mi Empresa C.A.</div>
                                    <div className="text-xs text-gray-500">J-12345678-9</div>
                                </div>
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>

                        {/* Right side */}
                        <div className="flex items-center gap-2">
                            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full"></span>
                            </button>

                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>

                            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

                            <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold text-sm">
                                    JP
                                </div>
                                <div className="hidden md:block text-left">
                                    <div className="text-sm font-medium">Juan Pérez</div>
                                    <div className="text-xs text-gray-500">Administrador</div>
                                </div>
                                <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Page content */}
                <main className="p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}

function Sidebar({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
    const [expandedItems, setExpandedItems] = useState<string[]>([])

    const toggleExpand = (name: string) => {
        setExpandedItems(prev =>
            prev.includes(name) ? prev.filter(item => item !== name) : [...prev, name]
        )
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            {/* Logo */}
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-md">
                        <Building className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-display font-bold text-gradient">NOVA-ADM</span>
                </Link>

                {onClose && (
                    <button onClick={onClose} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1 scrollbar-thin overflow-y-auto">
                {navigation.map((item) => (
                    <div key={item.name}>
                        {item.children ? (
                            <>
                                <button
                                    onClick={() => toggleExpand(item.name)}
                                    className={cn(
                                        'sidebar-link w-full',
                                        pathname.startsWith(item.href) && 'bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                                    )}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="flex-1 text-left">{item.name}</span>
                                    <ChevronDown className={cn(
                                        'w-4 h-4 transition-transform',
                                        expandedItems.includes(item.name) && 'rotate-180'
                                    )} />
                                </button>

                                {expandedItems.includes(item.name) && (
                                    <div className="ml-8 mt-1 space-y-1">
                                        {item.children.map((child) => (
                                            <Link
                                                key={child.href}
                                                href={child.href}
                                                className={cn(
                                                    'sidebar-link text-sm',
                                                    pathname === child.href && 'active'
                                                )}
                                            >
                                                {child.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <Link
                                href={item.href}
                                className={cn(
                                    'sidebar-link',
                                    pathname === item.href && 'active'
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.name}</span>
                            </Link>
                        )}
                    </div>
                ))}
            </nav>

            {/* User section */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button className="sidebar-link w-full text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20">
                    <LogOut className="w-5 h-5" />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </div>
    )
}
