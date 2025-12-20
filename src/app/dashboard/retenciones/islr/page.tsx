'use client'

import { useState, useEffect } from 'react'
import { Plus, FileText, Download } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const SERVICE_TYPES = [
    { value: 'PROFESSIONAL_SERVICES', label: 'Servicios Profesionales', rate: 3 },
    { value: 'TECHNICAL_SERVICES', label: 'Servicios Técnicos', rate: 2 },
    { value: 'CONSULTING', label: 'Consultoría', rate: 3 },
    { value: 'LEGAL', label: 'Servicios Legales', rate: 3 },
    { value: 'ACCOUNTING', label: 'Contabilidad', rate: 3 },
    { value: 'MEDICAL', label: 'Servicios Médicos', rate: 3 },
    { value: 'ENGINEERING', label: 'Ingeniería', rate: 3 },
    { value: 'MAINTENANCE', label: 'Mantenimiento', rate: 2 },
    { value: 'TRANSPORT', label: 'Transporte', rate: 2 },
    { value: 'OTHER', label: 'Otros', rate: 2 },
]

export default function RetencionesISLRPage() {
    const [withholdings, setWithholdings] = useState<any[]>([])
    const [sales, setSales] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showGenerate, setShowGenerate] = useState(false)
    const [selectedSale, setSelectedSale] = useState<any>(null)
    const [serviceType, setServiceType] = useState('PROFESSIONAL_SERVICES')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [whRes, salesRes] = await Promise.all([
                fetch('/api/withholdings/islr'),
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

    const generateWithholding = async () => {
        if (!selectedSale) return

        try {
            const res = await fetch('/api/withholdings/islr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ saleId: selectedSale.id, serviceType }),
            })

            const data = await res.json()

            if (data.success) {
                alert(`✅ Retención ISLR generada: ${data.withholding.withholdingNumber}`)
                fetchData()
                setShowGenerate(false)
                setSelectedSale(null)
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
                    <h1 className="text-3xl font-bold mb-2">Retenciones de ISLR</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Impuesto Sobre la Renta - Servicios profesionales y técnicos
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
                        <FileText className="w-5 h-5 text-purple-500" />
                    </div>
                    <p className="text-3xl font-bold">{withholdings.length}</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Monto Retenido
                        </h3>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
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
                        <p>No hay retenciones ISLR generadas</p>
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
                                        Servicio
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Fecha
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Tasa
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Base
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Retenido
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
                                        <td className="px-6 py-4 text-sm">
                                            {SERVICE_TYPES.find((t) => t.value === w.serviceType)?.label || w.serviceType}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {formatDate(w.withholdingDate)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            {w.rate}%
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            ${formatCurrency(w.baseAmountUSD)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-purple-600">
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
                                <h2 className="text-2xl font-bold">Generar Retención ISLR</h2>
                                <button onClick={() => setShowGenerate(false)} className="text-gray-500">
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Tipo de Servicio</label>
                                    <select
                                        value={serviceType}
                                        onChange={(e) => setServiceType(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                    >
                                        {SERVICE_TYPES.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label} ({type.rate}%)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Seleccionar Venta</label>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {sales.length === 0 ? (
                                            <p className="text-center py-4 text-gray-500">
                                                No hay ventas sin retención ISLR
                                            </p>
                                        ) : (
                                            sales.map((sale) => {
                                                const selectedType = SERVICE_TYPES.find((t) => t.value === serviceType)
                                                const retention = (sale.subtotalUSD * (selectedType?.rate || 2)) / 100

                                                return (
                                                    <div
                                                        key={sale.id}
                                                        onClick={() => setSelectedSale(sale)}
                                                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedSale?.id === sale.id
                                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                                : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                                                            }`}
                                                    >
                                                        <div className="flex justify-between">
                                                            <div>
                                                                <p className="font-medium">{sale.invoiceNumber}</p>
                                                                <p className="text-sm text-gray-600">{sale.customer.name}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm text-gray-600">Base:</p>
                                                                <p className="font-bold">${formatCurrency(sale.subtotalUSD)}</p>
                                                                <p className="text-sm text-purple-600">
                                                                    Retención: ${formatCurrency(retention)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        )}
                                    </div>
                                </div>

                                <Button
                                    onClick={generateWithholding}
                                    disabled={!selectedSale}
                                    className="w-full"
                                >
                                    Generar Retención
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}
