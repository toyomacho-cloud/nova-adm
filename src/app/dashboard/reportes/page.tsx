'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, ShoppingBag, Calendar, Download } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface ReportData {
    period: string
    summary: {
        totalSalesUSD: number
        totalSalesBS: number
        transactionCount: number
        averageTicketUSD: number
    }
    byPaymentMethod: Record<string, { count: number; totalUSD: number; totalBS: number }>
    topProducts: { id: string; name: string; quantity: number; revenue: number }[]
    topCustomers: { id: string; name: string; count: number; revenue: number }[]
}

export default function ReportesPage() {
    const [report, setReport] = useState<ReportData | null>(null)
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('month')

    useEffect(() => {
        fetchReport()
    }, [period])

    const fetchReport = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/reports/sales?period=${period}`)
            const data = await res.json()
            if (data.success) {
                setReport(data.report)
            }
        } catch (error) {
            console.error('Error fetching report:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value)
    }

    const getPeriodLabel = () => {
        switch (period) {
            case 'today':
                return 'Hoy'
            case 'week':
                return 'Esta Semana'
            case 'month':
                return 'Este Mes'
            case 'year':
                return 'Este Año'
            default:
                return period
        }
    }

    if (loading) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    <p className="mt-2 text-gray-600">Generando reporte...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Reportes de Ventas</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Análisis detallado de tu desempeño
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

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Ventas Totales
                        </h3>
                        <BarChart3 className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-2xl font-bold text-green-600">
                            ${formatCurrency(report?.summary.totalSalesUSD || 0)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Bs. {formatCurrency(report?.summary.totalSalesBS || 0)}
                        </p>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Transacciones
                        </h3>
                        <ShoppingBag className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold">{report?.summary.transactionCount || 0}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{getPeriodLabel()}</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Ticket Promedio
                        </h3>
                        <TrendingUp className="w-5 h-5 text-purple-500" />
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
                        ${formatCurrency(report?.summary.averageTicketUSD || 0)}
                    </p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Período
                        </h3>
                        <Calendar className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-lg font-bold">{getPeriodLabel()}</p>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Methods */}
                <Card>
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-bold">Ventas por Método de Pago</h2>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {Object.entries(report?.byPaymentMethod || {}).map(([method, data]) => {
                                const percentage =
                                    (data.totalUSD / (report?.summary.totalSalesUSD || 1)) * 100
                                return (
                                    <div key={method}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium">{method}</span>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-green-600">
                                                    ${formatCurrency(data.totalUSD)}
                                                </p>
                                                <p className="text-xs text-gray-500">{data.count} ventas</p>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-green-500 h-2 rounded-full transition-all"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 text-right">
                                            {percentage.toFixed(1)}%
                                        </p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </Card>

                {/* Top Products */}
                <Card>
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-bold">Top 10 Productos</h2>
                    </div>
                    <div className="p-6">
                        <div className="space-y-3">
                            {report?.topProducts.slice(0, 10).map((product, index) => (
                                <div
                                    key={product.id}
                                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 flex items-center justify-center bg-primary-100 dark:bg-primary-900 rounded-full font-bold text-primary-600 dark:text-primary-400">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{product.name}</p>
                                            <p className="text-xs text-gray-500">{product.quantity} vendidos</p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-sm text-green-600">
                                        ${formatCurrency(product.revenue)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Top Customers */}
            <Card>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-bold">Top 10 Clientes</h2>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {report?.topCustomers.slice(0, 10).map((customer, index) => (
                            <div
                                key={customer.id}
                                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-full font-bold text-blue-600 dark:text-blue-400">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium">{customer.name}</p>
                                        <p className="text-sm text-gray-500">{customer.count} compras</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-green-600">
                                        ${formatCurrency(customer.revenue)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    )
}
