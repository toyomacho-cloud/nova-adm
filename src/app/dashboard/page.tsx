'use client'

import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, ShoppingCart, Users, Package, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface DashboardData {
    sales: {
        totalUSD: number
        totalBS: number
        count: number
    }
    customers: {
        total: number
        newThisMonth: number
    }
    products: {
        total: number
        lowStock: number
    }
    recentSales: any[]
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('today')

    useEffect(() => {
        fetchDashboardData()
    }, [period])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)

            // Fetch sales report
            const salesRes = await fetch(`/api/reports/sales?period=${period}`)
            const salesData = await salesRes.json()

            // Fetch products
            const productsRes = await fetch('/api/products')
            const productsData = await productsRes.json()

            // Fetch customers
            const customersRes = await fetch('/api/customers')
            const customersData = await customersRes.json()

            // Fetch recent sales
            const recentSalesRes = await fetch('/api/sales?limit=5')
            const recentSalesData = await recentSalesRes.json()

            setData({
                sales: {
                    totalUSD: salesData.report?.summary.totalSalesUSD || 0,
                    totalBS: salesData.report?.summary.totalSalesBS || 0,
                    count: salesData.report?.summary.transactionCount || 0,
                },
                customers: {
                    total: customersData.customers?.length || 0,
                    newThisMonth: 0,
                },
                products: {
                    total: productsData.products?.length || 0,
                    lowStock: productsData.products?.filter((p: any) => p.stock <= p.minStock).length || 0,
                },
                recentSales: recentSalesData.sales || [],
            })
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
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

    if (loading) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    <p className="mt-2 text-gray-600">Cargando dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Resumen general de tu negocio
                    </p>
                </div>
                <div className="flex gap-2">
                    {['today', 'week', 'month'].map((p) => (
                        <Button
                            key={p}
                            variant={period === p ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setPeriod(p)}
                        >
                            {p === 'today' ? 'Hoy' : p === 'week' ? 'Semana' : 'Mes'}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Ventas {period === 'today' ? 'Hoy' : period === 'week' ? 'Esta Semana' : 'Este Mes'}
                        </h3>
                        <DollarSign className="w-8 h-8 text-green-500" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-3xl font-bold text-green-600">
                            ${formatCurrency(data?.sales.totalUSD || 0)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Bs. {formatCurrency(data?.sales.totalBS || 0)}
                        </p>
                        <p className="text-xs text-gray-500">
                            {data?.sales.count || 0} transacciones
                        </p>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Clientes
                        </h3>
                        <Users className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-3xl font-bold">{data?.customers.total || 0}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Total registrados
                        </p>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Productos
                        </h3>
                        <Package className="w-8 h-8 text-purple-500" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-3xl font-bold">{data?.products.total || 0}</p>
                        <p className="text-sm text-orange-600">
                            {data?.products.lowStock || 0} con stock bajo
                        </p>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Ticket Promedio
                        </h3>
                        <TrendingUp className="w-8 h-8 text-teal-500" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-3xl font-bold text-teal-600">
                            ${formatCurrency(
                                data?.sales.count ? data.sales.totalUSD / data.sales.count : 0
                            )}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Por venta
                        </p>
                    </div>
                </Card>
            </div>

            {/* Recent Sales */}
            <Card>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-bold">Ventas Recientes</h2>
                </div>
                <div className="p-6">
                    {data?.recentSales.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>No hay ventas registradas</p>
                            <Button
                                className="mt-4"
                                onClick={() => (window.location.href = '/dashboard/pos')}
                            >
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                Hacer Primera Venta
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {data?.recentSales.map((sale) => (
                                <div
                                    key={sale.id}
                                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium">{sale.invoiceNumber}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {sale.customer.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(sale.invoiceDate).toLocaleDateString('es-VE', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-600">
                                            ${formatCurrency(sale.totalUSD)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Bs. {formatCurrency(sale.totalBS)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => (window.location.href = '/dashboard/pos')}
                >
                    <ShoppingCart className="w-10 h-10 text-green-500 mb-3" />
                    <h3 className="font-bold mb-1">Nueva Venta</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Abrir punto de venta
                    </p>
                </Card>

                <Card
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => (window.location.href = '/dashboard/productos')}
                >
                    <Package className="w-10 h-10 text-blue-500 mb-3" />
                    <h3 className="font-bold mb-1">Gestionar Productos</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Ver inventario
                    </p>
                </Card>

                <Card
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => (window.location.href = '/dashboard/ventas')}
                >
                    <Calendar className="w-10 h-10 text-purple-500 mb-3" />
                    <h3 className="font-bold mb-1">Ver Reportes</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Análisis de ventas
                    </p>
                </Card>
            </div>
        </div>
    )
}
