'use client'

import { useState, useEffect } from 'react'
import { Plus, FileText, Download, Eye, Search, DollarSign } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Withholding {
    id: string
    withholdingNumber: string
    withholdingDate: string
    rate: number
    baseAmountUSD: number
    taxAmountUSD: number
    withholdingAmountUSD: number
    status: string
    customer: {
        name: string
        rif: string
    }
    sale: {
        id: string
        invoiceNumber: string
    }
}

interface Sale {
    id: string
    invoiceNumber: string
    invoiceDate: string
    totalUSD: number
    taxAmountUSD: number
    customer: {
        name: string
        rif: string
        isSpecialTaxpayer: boolean
    }
}

export default function RetencionesIVAPage() {
    const [withholdings, setWithholdings] = useState<Withholding[]>([])
    const [salesWithoutWithholding, setSalesWithoutWithholding] = useState<Sale[]>([])
    const [loading, setLoading] = useState(true)
    const [showGenerate, setShowGenerate] = useState(false)
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null)

    useEffect(() => {
        fetchWithholdings()
        fetchSalesWithoutWithholding()
    }, [])

    const fetchWithholdings = async () => {
        try {
            const res = await fetch('/api/withholdings/iva')
            const data = await res.json()
            if (data.success) {
                setWithholdings(data.withholdings)
            }
        } catch (error) {
            console.error('Error:', error)
        }
    }

    const fetchSalesWithoutWithholding = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/sales')
            const data = await res.json()

            if (data.success) {
                // Get withholding sale IDs
                const withholdingSaleIds = withholdings.map((w) => w.sale?.id || '')

                // Filter sales from special taxpayers without withholding
                const filtered = data.sales.filter(
                    (s: Sale) =>
                        s.customer.isSpecialTaxpayer &&
                        !withholdingSaleIds.includes(s.id)
                )
                setSalesWithoutWithholding(filtered)
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const generateWithholding = async (saleId: string) => {
        try {
            const res = await fetch('/api/withholdings/iva', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ saleId }),
            })

            const data = await res.json()

            if (data.success) {
                alert(`✅ Retención generada: ${data.withholding.withholdingNumber}`)
                fetchWithholdings()
                fetchSalesWithoutWithholding()
                setShowGenerate(false)
                setSelectedSale(null)
            } else {
                alert(`❌ Error: ${data.error}`)
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al generar retención')
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
        })
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Retenciones de IVA</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Gestión de retenciones para contribuyentes especiales
                    </p>
                </div>
                <Button onClick={() => setShowGenerate(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Generar Retención
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Total Retenciones
                        </h3>
                        <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-3xl font-bold">{withholdings.length}</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Monto Retenido
                        </h3>
                        <DollarSign className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                        $
                        {formatCurrency(
                            withholdings.reduce((sum, w) => sum + w.withholdingAmountUSD, 0)
                        )}
                    </p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Pendientes
                        </h3>
                        <FileText className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-3xl font-bold text-orange-600">
                        {salesWithoutWithholding.length}
                    </p>
                </Card>
            </div>

            {/* Withholdings List */}
            <Card>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-bold">Retenciones Generadas</h2>
                </div>
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    </div>
                ) : withholdings.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <p>No hay retenciones generadas</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Número
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Cliente
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Factura
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Fecha
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Tasa
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        IVA
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Retenido
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {withholdings.map((w) => (
                                    <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-sm font-medium">{w.withholdingNumber}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium">{w.customer.name}</p>
                                            <p className="text-xs text-gray-500">{w.customer.rif}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {w.sale.invoiceNumber}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {formatDate(w.withholdingDate)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            {w.rate}%
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            ${formatCurrency(w.taxAmountUSD)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-600">
                                            ${formatCurrency(w.withholdingAmountUSD)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <Button variant="outline" size="sm">
                                                <Download className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Generate Modal */}
            {showGenerate && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">Generar Retención de IVA</h2>
                                <button
                                    onClick={() => setShowGenerate(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>

                            <p className="mb-4 text-gray-600 dark:text-gray-400">
                                Ventas de contribuyentes especiales sin retención:
                            </p>

                            <div className="space-y-2">
                                {salesWithoutWithholding.length === 0 ? (
                                    <p className="text-center py-8 text-gray-500">
                                        No hay ventas pendientes de retención
                                    </p>
                                ) : (
                                    salesWithoutWithholding.map((sale) => (
                                        <div
                                            key={sale.id}
                                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 transition-colors"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-medium">{sale.invoiceNumber}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {sale.customer.name} - {sale.customer.rif}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {formatDate(sale.invoiceDate)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-600">IVA:</p>
                                                    <p className="font-bold">${formatCurrency(sale.taxAmountUSD)}</p>
                                                    <p className="text-sm text-green-600">
                                                        Retención 75%: ${formatCurrency(sale.taxAmountUSD * 0.75)}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => generateWithholding(sale.id)}
                                                className="w-full mt-2"
                                                size="sm"
                                            >
                                                Generar Retención
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}
