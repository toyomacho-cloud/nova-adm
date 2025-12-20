'use client'

import { useState, useEffect } from 'react'
import { Plus, FileText } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function RetencionesMunicipalPage() {
    const [withholdings, setWithholdings] = useState<any[]>([])
    const [sales, setSales] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showGenerate, setShowGenerate] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [whRes, salesRes] = await Promise.all([
                fetch('/api/withholdings/municipal'),
                fetch('/api/sales'),
            ])

            const whData = await whRes.json()
            const salesData = await salesRes.json()

            if (whData.success) setWithholdings(whData.withholdings)
            if (salesData.success) {
                const withholdingSaleIds = whData.withholdings.map((w: any) => w.saleId)
                setSales(salesData.sales.filter((s: any) => !withholdingSaleIds.includes(s.id)))
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const generateWithholding = async (saleId: string) => {
        try {
            const res = await fetch('/api/withholdings/municipal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ saleId }),
            })

            const data = await res.json()

            if (data.success) {
                alert(`✅ Retención Municipal generada: ${data.withholding.withholdingNumber}`)
                fetchData()
                setShowGenerate(false)
            } else {
                alert(`❌ Error: ${data.error}`)
            }
        } catch (error) {
            alert('Error al generar retención')
        }
    }

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(value)

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('es-VE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Retenciones Municipales</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Retención Municipal 1% sobre base imponible
                    </p>
                </div>
                <Button onClick={() => setShowGenerate(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Generar Retención
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Total Retenciones
                        </h3>
                        <FileText className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-3xl font-bold">{withholdings.length}</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Monto Retenido
                        </h3>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">
                        ${formatCurrency(withholdings.reduce((sum, w) => sum + w.withholdingAmountUSD, 0))}
                    </p>
                </Card>
            </div>

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
                        <p>No hay retenciones municipales generadas</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Número
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Cliente
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Fecha
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Base
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Retenido (1%)
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {withholdings.map((w) => (
                                    <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {w.withholdingNumber}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium">{w.customer.name}</p>
                                            <p className="text-xs text-gray-500">{w.customer.rif}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {formatDate(w.withholdingDate)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            ${formatCurrency(w.baseAmountUSD)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-orange-600">
                                            ${formatCurrency(w.withholdingAmountUSD)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {showGenerate && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">Generar Retención Municipal</h2>
                                <button onClick={() => setShowGenerate(false)} className="text-gray-500">
                                    ✕
                                </button>
                            </div>

                            <p className="mb-4 text-gray-600 dark:text-gray-400">
                                Ventas sin retención municipal (1% sobre base):
                            </p>

                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {sales.length === 0 ? (
                                    <p className="text-center py-8 text-gray-500">
                                        No hay ventas sin retención municipal
                                    </p>
                                ) : (
                                    sales.map((sale) => {
                                        const retention = sale.subtotalUSD * 0.01

                                        return (
                                            <div
                                                key={sale.id}
                                                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="font-medium">{sale.invoiceNumber}</p>
                                                        <p className="text-sm text-gray-600">{sale.customer.name}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-gray-600">Base:</p>
                                                        <p className="font-bold">${formatCurrency(sale.subtotalUSD)}</p>
                                                        <p className="text-sm text-orange-600">
                                                            Retención 1%: ${formatCurrency(retention)}
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
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}
