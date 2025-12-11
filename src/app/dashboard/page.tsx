'use client'

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingCart,
    FileText,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function DashboardPage() {
    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                    Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Resumen general de tu empresa
                </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Ventas del Mes"
                    value={formatCurrency(125450.50)}
                    change="+12.5%"
                    trend="up"
                    icon={<ShoppingCart className="w-6 h-6" />}
                    color="success"
                />

                <MetricCard
                    title="Compras del Mes"
                    value={formatCurrency(87230.00)}
                    change="+8.3%"
                    trend="up"
                    icon={<FileText className="w-6 h-6" />}
                    color="info"
                />

                <MetricCard
                    title="Por Cobrar"
                    value={formatCurrency(45800.25)}
                    change="-5.2%"
                    trend="down"
                    icon={<TrendingUp className="w-6 h-6" />}
                    color="warning"
                />

                <MetricCard
                    title="Por Pagar"
                    value={formatCurrency(32100.75)}
                    change="-3.1%"
                    trend="down"
                    icon={<TrendingDown className="w-6 h-6" />}
                    color="danger"
                />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <Card variant="glass" className="lg:col-span-2">
                    <h2 className="text-xl font-display font-semibold mb-6">Actividad Reciente</h2>

                    <div className="space-y-4">
                        {recentActivity.map((activity, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activity.type === 'sale' ? 'bg-success-100 text-success-600' :
                                        activity.type === 'purchase' ? 'bg-info-100 text-info-600' :
                                            'bg-warning-100 text-warning-600'
                                    }`}>
                                    {activity.type === 'sale' ? <ShoppingCart className="w-5 h-5" /> :
                                        activity.type === 'purchase' ? <FileText className="w-5 h-5" /> :
                                            <DollarSign className="w-5 h-5" />}
                                </div>

                                <div className="flex-1">
                                    <div className="font-medium">{activity.description}</div>
                                    <div className="text-sm text-gray-500">{activity.time}</div>
                                </div>

                                <div className="text-right">
                                    <div className="font-semibold">{formatCurrency(activity.amount)}</div>
                                    <Badge variant={
                                        activity.status === 'completed' ? 'success' :
                                            activity.status === 'pending' ? 'warning' :
                                                'default'
                                    }>
                                        {activity.status === 'completed' ? 'Completado' : 'Pendiente'}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Quick Actions & Alerts */}
                <div className="space-y-6">
                    <Card variant="glass">
                        <h2 className="text-xl font-display font-semibold mb-4">Acciones Rápidas</h2>

                        <div className="space-y-2">
                            <QuickActionButton href="/dashboard/ventas/nueva" title="Nueva Venta" icon={<ShoppingCart className="w-4 h-4" />} />
                            <QuickActionButton href="/dashboard/compras/nueva" title="Nueva Compra" icon={<FileText className="w-4 h-4" />} />
                            <QuickActionButton href="/dashboard/retenciones/iva" title="Retención IVA" icon={<FileText className="w-4 h-4" />} />
                            <QuickActionButton href="/dashboard/caja" title="Abrir Caja" icon={<DollarSign className="w-4 h-4" />} />
                        </div>
                    </Card>

                    <Card variant="glass" className="border-l-4 border-warning-500">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-warning-900 dark:text-warning-100 mb-1">
                                    Recordatorio
                                </h3>
                                <p className="text-sm text-warning-800 dark:text-warning-200">
                                    Tienes 3 retenciones de IVA pendientes por declarar este mes.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Pending Items */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card variant="glass">
                    <h2 className="text-xl font-display font-semibold mb-4">Facturas Vencidas</h2>

                    <div className="space-y-3">
                        {overdueInvoices.map((invoice, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-danger-50 dark:bg-danger-900/20 rounded-lg">
                                <div>
                                    <div className="font-medium">{invoice.client}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Factura {invoice.number} • Vence: {invoice.dueDate}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold text-danger-600">
                                        {formatCurrency(invoice.amount)}
                                    </div>
                                    <div className="text-xs text-danger-600">
                                        {invoice.daysOverdue} días vencida
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card variant="glass">
                    <h2 className="text-xl font-display font-semibold mb-4">Próximos Pagos</h2>

                    <div className="space-y-3">
                        {upcomingPayments.map((payment, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-info-50 dark:bg-info-900/20 rounded-lg">
                                <div>
                                    <div className="font-medium">{payment.vendor}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        {payment.description} • {payment.dueDate}
                                    </div>
                                </div>
                                <div className="font-semibold text-info-600">
                                    {formatCurrency(payment.amount)}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    )
}

interface MetricCardProps {
    title: string
    value: string
    change: string
    trend: 'up' | 'down'
    icon: React.ReactNode
    color: 'success' | 'info' | 'warning' | 'danger'
}

function MetricCard({ title, value, change, trend, icon, color }: MetricCardProps) {
    const colorClasses = {
        success: 'from-success-500 to-success-600',
        info: 'from-secondary-500 to-secondary-600',
        warning: 'from-warning-500 to-warning-600',
        danger: 'from-danger-500 to-danger-600',
    }

    return (
        <Card variant="glass" className="relative overflow-hidden">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
                    <h3 className="text-2xl font-bold">{value}</h3>
                </div>

                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-white shadow-md`}>
                    {icon}
                </div>
            </div>

            <div className="flex items-center gap-1 text-sm">
                {trend === 'up' ? (
                    <ArrowUpRight className="w-4 h-4 text-success-600" />
                ) : (
                    <ArrowDownRight className="w-4 h-4 text-danger-600" />
                )}
                <span className={trend === 'up' ? 'text-success-600' : 'text-danger-600'}>
                    {change}
                </span>
                <span className="text-gray-500">vs mes anterior</span>
            </div>
        </Card>
    )
}

function QuickActionButton({ href, title, icon }: { href: string; title: string; icon: React.ReactNode }) {
    return (
        <a
            href={href}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all hover:scale-[1.02] group"
        >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white">
                {icon}
            </div>
            <span className="font-medium group-hover:text-primary-600 transition-colors">{title}</span>
        </a>
    )
}

const recentActivity = [
    { type: 'sale', description: 'Venta a Cliente ABC', amount: 15420.50, time: 'Hace 2 horas', status: 'completed' },
    { type: 'purchase', description: 'Compra a Proveedor XYZ', amount: 8750.00, time: 'Hace 5 horas', status: 'completed' },
    { type: 'payment', description: 'Pago de Factura #001', amount: 12300.25, time: 'Hace 1 día', status: 'pending' },
    { type: 'sale', description: 'Venta a Cliente DEF', amount: 9850.75, time: 'Hace 1 día', status: 'completed' },
]

const overdueInvoices = [
    { client: 'Distribuidora El Sol C.A.', number: '00145', amount: 12500.00, dueDate: '05/12/2024', daysOverdue: 6 },
    { client: 'Importadora Luna S.A.', number: '00142', amount: 8340.50, dueDate: '03/12/2024', daysOverdue: 8 },
]

const upcomingPayments = [
    { vendor: 'Productos Industriales C.A.', description: 'Factura #8821', amount: 15200.00, dueDate: '15/12/2024' },
    { vendor: 'Suministros Generales', description: 'Factura #3345', amount: 6750.25, dueDate: '18/12/2024' },
]
