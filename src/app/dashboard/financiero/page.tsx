'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Package, Users, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function FinancialDashboardPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('month')

    useEffect(() => {
        fetchData()
    }, [period])

    const fetchData = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/reports/financial?period=${period}`)
            const result = await res.json()
            if (result.success) {
                setData(result)
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(value || 0)

    if (loading) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
            </div>
        )
    }

    const metrics = data?.metrics || {}
    const profitPositive = (metrics.profit?.gross || 0) >= 0

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Dashboard Financiero</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Vista consolidada de tu negocio
                    </p>
                </div>
                <div className="flex gap-2">
                    {['today', 'week', 'month', 'year'].map((p) => (
                        <Button
                            key={p}
                            variant={period === p ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setPeriod(p)}
                        >
                            {p === 'today' ? 'Hoy' : p === 'week' ? 'Semana' : p === 'month' ? 'Mes' : 'Año'}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Ingresos
                        </h3>
                        <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                    <p className="text-3xl font-bold text-green-600">
                        ${formatCurrency(metrics.revenue?.total || 0)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                        {metrics.revenue?.count || 0} ventas
                    </p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Costos
                        </h3>
                        <TrendingDown className="w-8 h-8 text-red-500" />
                    </div>
                    <p className="text-3xl font-bold text-red-600">
                        ${formatCurrency(metrics.costs?.total || 0)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                        {metrics.costs?.count || 0} compras
                    </p>
                </Card>

                <Card className={`p-6 ${profitPositive ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Ganancia Bruta
                        </h3>
                        <DollarSign className={`w-8 h-8 ${profitPositive ? 'text-green-500' : 'text-red-500'}`} />
                    </div>
                    <p className={`text-3xl font-bold ${profitPositive ? 'text-green-600' : 'text-red-600'}`}>
                        ${formatCurrency(metrics.profit?.gross || 0)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                        Margen: {(metrics.profit?.margin || 0).toFixed(1)}%
                    </p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Por Cobrar
                        </h3>
                        <AlertTriangle className="w-8 h-8 text-orange-500" />
                    </div>
                    <p className="text-3xl font-bold text-orange-600">
                        ${formatCurrency(metrics.receivables?.total || 0)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                        {metrics.receivables?.count || 0} pendientes
                    </p>
                </Card>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Package className="w-6 h-6 text-purple-500" />
                        <h3 className="font-bold">Inventario</h3>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Valor Total:</span>
                            <span className="font-bold">${formatCurrency(metrics.inventory?.value || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Productos:</span>
                            <span className="font-bold">{metrics.inventory?.products || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-orange-600">Stock Bajo:</span>
                            <span className="font-bold text-orange-600">{metrics.inventory?.lowStock || 0}</span>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Users className="w-6 h-6 text-blue-500" />
                        <h3 className="font-bold">Clientes</h3>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total:</span>
                            <span className="font-bold">{metrics.customers?.total || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Activos:</span>
                            <span className="font-bold text-green-600">{metrics.customers?.active || 0}</span>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <DollarSign className="w-6 h-6 text-teal-500" />
                        <h3 className="font-bold">Ticket Promedio</h3>
                    </div>
                    <p className="text-3xl font-bold text-teal-600">
                        ${formatCurrency(metrics.revenue?.average || 0)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Por venta</p>
                </Card>
            </div>

            {/* P&L Preview */}
            <Card>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-bold">Estado de Resultados (Simplificado)</h2>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                            <span className="font-medium">Ingresos por Ventas</span>
                            <span className="font-bold text-green-600 text-lg">
                                ${formatCurrency(metrics.revenue?.total || 0)}
                            </span>
                        </div>

                        <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
                            <span className="font-medium">Costo de Ventas (Compras)</span>
                            <span className="font-bold text-red-600 text-lg">
                                -${formatCurrency(metrics.costs?.total || 0)}
                            </span>
                        </div>

                        <div className="flex justify-between items-center py-4 bg-gray-50 dark:bg-gray-800 rounded-lg px-4">
                            <span className="font-bold text-lg">Ganancia Bruta</span>
                            <span className={`font-bold text-2xl ${profitPositive ? 'text-green-600' : 'text-red-600'}`}>
                                ${formatCurrency(metrics.profit?.gross || 0)}
                            </span>
                        </div>

                        <div className="flex justify-between items-center py-2 text-sm text-gray-600">
                            <span>Margen Bruto</span>
                            <span className="font-bold">{(metrics.profit?.margin || 0).toFixed(2)}%</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => (window.location.href = '/dashboard/ventas')}
                >
                    <TrendingUp className="w-10 h-10 text-green-500 mb-3" />
                    <h3 className="font-bold mb-1">Ver Ventas</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Historial completo
                    </p>
                </Card>

                <Card
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => (window.location.href = '/dashboard/compras')}
                >
                    <TrendingDown className="w-10 h-10 text-red-500 mb-3" />
                    <h3 className="font-bold mb-1">Ver Compras</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Registro de compras
                    </p>
                </Card>

                <Card
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => (window.location.href = '/dashboard/cuentas-por-cobrar')}
                >
                    <AlertTriangle className="w-10 h-10 text-orange-500 mb-3" />
                    <h3 className="font-bold mb-1">Cobrar</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Facturas pendientes
                    </p>
                </Card>

                <Card
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => (window.location.href = '/dashboard/libros-fiscales')}
                >
                    <Package className="w-10 h-10 text-blue-500 mb-3" />
                    <h3 className="font-bold mb-1">Libros Fiscales</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Ventas y Compras
                    </p>
                </Card>
            </div>
        </div>
    )
}
