'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, Eye, DollarSign, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Sale {
    id: string
    saleNumber: string
    invoiceNumber: string
    invoiceDate: string
    totalUSD: number
    totalBS: number
    paymentStatus: string
    status: string
    customer: {
        name: string
        rif: string
    }
    paymentMethod: {
        name: string
        currency: string
    }
    items: {
        id: string
        description: string
        quantity: number
        unitPriceUSD: number
        totalUSD: number
    }[]
}

export default function VentasPage() {
    const [sales, setSales] = useState<Sale[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null)

    useEffect(() => {
        fetchSales()
    }, [])

    const fetchSales = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/sales')
            const data = await res.json()
            if (data.success) {
                setSales(data.sales)
            }
        } catch (error) {
            console.error('Error fetching sales:', error)
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-VE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    // Calculate totals
    const totalSalesUSD = sales.reduce((sum, sale) => sum + sale.totalUSD, 0)
    const totalSalesBS = sales.reduce((sum, sale) => sum + sale.totalBS, 0)

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Ventas</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Historial de todas las ventas realizadas
                    </p>
                </div>
                <Button onClick={() => (window.location.href = '/dashboard/pos')}>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Nueva Venta (POS)
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Total Ventas
                        </h3>
                        <ShoppingCart className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-3xl font-bold">{sales.length}</p>
                    <p className="text-xs text-gray-500 mt-1">transacciones</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Total en USD
                        </h3>
                        <DollarSign className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-3xl font-bold text-green-600">
                        ${formatCurrency(totalSalesUSD)}
                    </p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Total en Bs
                        </h3>
                        <DollarSign className="w-5 h-5 text-teal-500" />
                    </div>
                    <p className="text-2xl font-bold text-teal-600">
                        Bs. {formatCurrency(totalSalesBS)}
                    </p>
                </Card>
            </div>

            {/* Sales List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    <p className="mt-2 text-gray-600">Cargando ventas...</p>
                </div>
            ) : sales.length === 0 ? (
                <Card className="p-12 text-center">
                    <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">No hay ventas</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Las ventas realizadas aparecerán aquí
                    </p>
                    <Button onClick={() => (window.location.href = '/dashboard/pos')}>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Hacer Primera Venta
                    </Button>
                </Card>
            ) : (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Factura
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Cliente
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Fecha
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Método
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total USD
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total Bs
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                {sales.map((sale) => (
                                    <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <p className="text-sm font-medium">{sale.invoiceNumber}</p>
                                                <p className="text-xs text-gray-500">{sale.saleNumber}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-medium">{sale.customer.name}</p>
                                                <p className="text-xs text-gray-500">{sale.customer.rif}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {formatDate(sale.invoiceDate)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                                                {sale.paymentMethod.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                                            ${formatCurrency(sale.totalUSD)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-gray-100">
                                            Bs. {formatCurrency(sale.totalBS)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                                                {sale.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedSale(sale)}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Sale Detail Modal */}
            {selectedSale && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold">{selectedSale.invoiceNumber}</h2>
                                    <p className="text-sm text-gray-500">{selectedSale.saleNumber}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedSale(null)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <p className="text-sm text-gray-500">Cliente</p>
                                    <p className="font-medium">{selectedSale.customer.name}</p>
                                    <p className="text-sm text-gray-500">{selectedSale.customer.rif}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Fecha</p>
                                    <p className="font-medium">{formatDate(selectedSale.invoiceDate)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Método de Pago</p>
                                    <p className="font-medium">{selectedSale.paymentMethod.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Estado</p>
                                    <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                                        {selectedSale.paymentStatus}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <h3 className="font-semibold mb-3">Items</h3>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-700">
                                            <th className="text-left py-2">Producto</th>
                                            <th className="text-center py-2">Cant.</th>
                                            <th className="text-right py-2">Precio</th>
                                            <th className="text-right py-2">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedSale.items.map((item) => (
                                            <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                                                <td className="py-2">{item.description}</td>
                                                <td className="text-center py-2">{item.quantity}</td>
                                                <td className="text-right py-2">${formatCurrency(item.unitPriceUSD)}</td>
                                                <td className="text-right py-2 font-medium">
                                                    ${formatCurrency(item.totalUSD)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>TOTAL USD:</span>
                                        <span className="text-green-600">${formatCurrency(selectedSale.totalUSD)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                        <span>TOTAL Bs:</span>
                                        <span>Bs. {formatCurrency(selectedSale.totalBS)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}
