'use client'

import { useState, useEffect } from 'react'
import { Book, Download, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export default function LibrosFiscalesPage() {
    const [salesBook, setSalesBook] = useState<any>(null)
    const [purchasesBook, setPurchasesBook] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [month, setMonth] = useState(new Date().getMonth() + 1)
    const [year, setYear] = useState(new Date().getFullYear())

    useEffect(() => {
        fetchBooks()
    }, [month, year])

    const fetchBooks = async () => {
        try {
            setLoading(true)
            const [salesRes, purchasesRes] = await Promise.all([
                fetch(`/api/fiscal-books/sales?month=${month}&year=${year}`),
                fetch(`/api/fiscal-books/purchases?month=${month}&year=${year}`),
            ])

            const salesData = await salesRes.json()
            const purchasesData = await purchasesRes.json()

            if (salesData.success) setSalesBook(salesData)
            if (purchasesData.success) setPurchasesBook(purchasesData)
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const exportBook = (type: 'sales' | 'purchases') => {
        const data = type === 'sales' ? salesBook : purchasesBook
        if (!data) return

        let content = `LIBRO DE ${type === 'sales' ? 'VENTAS' : 'COMPRAS'}\n`
        content += `PERÍODO: ${MONTHS[month - 1]} ${year}\n`
        content += `FECHA: ${new Date().toLocaleDateString('es-VE')}\n`
        content += '='.repeat(100) + '\n\n'

        const items = type === 'sales' ? data.sales : data.purchases
        items.forEach((item: any, index: number) => {
            const entity = type === 'sales' ? item.customer : item.vendor
            content += `${(index + 1).toString().padStart(4, '0')} | `
            content += `${item.invoiceNumber.padEnd(15)} | `
            content += `${new Date(item.invoiceDate).toLocaleDateString('es-VE').padEnd(12)} | `
            content += `${entity.rif.padEnd(15)} | `
            content += `${entity.name.substring(0, 35).padEnd(35)} | `
            content += `${item.subtotal.toFixed(2).padStart(12)} | `
            content += `${item.taxAmount.toFixed(2).padStart(12)} | `
            content += `${item.total.toFixed(2).padStart(12)}\n`
        })

        content += '\n' + '='.repeat(100) + '\n'
        content += `TOTAL TRANSACCIONES: ${data.totals.transactions}\n`
        content += `TOTAL BASE IMPONIBLE: $${data.totals[type === 'sales' ? 'subtotalUSD' : 'subtotal'].toFixed(2)}\n`
        content += `TOTAL IVA: $${data.totals[type === 'sales' ? 'taxUSD' : 'tax'].toFixed(2)}\n`
        content += `TOTAL: $${data.totals[type === 'sales' ? 'totalUSD' : 'total'].toFixed(2)}\n`

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `LIBRO_${type.toUpperCase()}_${month.toString().padStart(2, '0')}_${year}.txt`
        link.click()
        URL.revokeObjectURL(url)
    }

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(value || 0)

    if (loading) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    <p className="mt-2 text-gray-600">Generando libros fiscales...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Libros Fiscales</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Libros de Ventas y Compras automáticos
                    </p>
                </div>
                <div className="flex gap-2">
                    <select
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    >
                        {MONTHS.map((m, i) => (
                            <option key={i} value={i + 1}>
                                {m}
                            </option>
                        ))}
                    </select>
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    >
                        {[2025, 2024, 2023].map((y) => (
                            <option key={y} value={y}>
                                {y}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Libro de Ventas */}
                <Card>
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Book className="w-6 h-6 text-green-500" />
                                <h2 className="text-xl font-bold">Libro de Ventas</h2>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => exportBook('sales')}
                                disabled={!salesBook?.totals.transactions}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Exportar
                            </Button>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Transacciones</p>
                                <p className="text-2xl font-bold">{salesBook?.totals.transactions || 0}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                                <p className="text-2xl font-bold text-green-600">
                                    ${formatCurrency(salesBook?.totals.totalUSD || 0)}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Base Imponible:</span>
                                <span className="font-medium">${formatCurrency(salesBook?.totals.subtotalUSD || 0)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">IVA:</span>
                                <span className="font-medium">${formatCurrency(salesBook?.totals.taxUSD || 0)}</span>
                            </div>
                        </div>

                        {salesBook?.byCustomer?.slice(0, 5).map((item: any) => (
                            <div
                                key={item.customer.id}
                                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium text-sm">{item.customer.name}</p>
                                        <p className="text-xs text-gray-500">{item.customer.rif}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold">${formatCurrency(item.total)}</p>
                                        <p className="text-xs text-gray-500">{item.transactions} ops</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Libro de Compras */}
                <Card>
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Book className="w-6 h-6 text-blue-500" />
                                <h2 className="text-xl font-bold">Libro de Compras</h2>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => exportBook('purchases')}
                                disabled={!purchasesBook?.totals.transactions}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Exportar
                            </Button>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Transacciones</p>
                                <p className="text-2xl font-bold">{purchasesBook?.totals.transactions || 0}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    ${formatCurrency(purchasesBook?.totals.total || 0)}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Base Imponible:</span>
                                <span className="font-medium">${formatCurrency(purchasesBook?.totals.subtotal || 0)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">IVA:</span>
                                <span className="font-medium">${formatCurrency(purchasesBook?.totals.tax || 0)}</span>
                            </div>
                        </div>

                        {purchasesBook?.byVendor?.slice(0, 5).map((item: any) => (
                            <div
                                key={item.vendor.id}
                                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium text-sm">{item.vendor.name}</p>
                                        <p className="text-xs text-gray-500">{item.vendor.rif}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold">${formatCurrency(item.total)}</p>
                                        <p className="text-xs text-gray-500">{item.transactions} ops</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                    <Calendar className="w-6 h-6 text-blue-600 mt-1" />
                    <div>
                        <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
                            Período: {MONTHS[month - 1]} {year}
                        </h3>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            Los libros fiscales se generan automáticamente desde las transacciones registradas.
                            Puedes exportarlos en formato .TXT para presentación ante autoridades.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    )
}
