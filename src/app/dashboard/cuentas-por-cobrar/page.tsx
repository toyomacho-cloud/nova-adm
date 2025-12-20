'use client'

import { useState, useEffect } from 'react'
import { DollarSign, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Receivable {
    id: string
    invoiceNumber: string
    invoiceDate: string
    totalUSD: number
    paymentStatus: string
    customer: {
        name: string
        rif: string
    }
    payments?: any[]
}

export default function CuentasPorCobrarPage() {
    const [receivables, setReceivables] = useState<Receivable[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'pending' | 'partial' | 'paid'>('all')
    const [showPayment, setShowPayment] = useState(false)
    const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null)

    const [paymentAmount, setPaymentAmount] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('')
    const [paymentMethods, setPaymentMethods] = useState<any[]>([])

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [salesRes, methodsRes] = await Promise.all([
                fetch('/api/sales'),
                fetch('/api/payment-methods'),
            ])

            const salesData = await salesRes.json()
            const methodsData = await methodsRes.json()

            if (salesData.success) {
                // Transform sales to receivables
                setReceivables(salesData.sales)
            }
            if (methodsData.success) {
                setPaymentMethods(methodsData.paymentMethods.filter((m: any) => m.isActive))
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const registerPayment = async () => {
        if (!selectedReceivable || !paymentAmount || !paymentMethod) return

        try {
            const res = await fetch(`/api/receivables/${selectedReceivable.id}/payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amountUSD: parseFloat(paymentAmount),
                    paymentMethodId: paymentMethod,
                }),
            })

            const data = await res.json()

            if (data.success) {
                alert('✅ Pago registrado exitosamente')
                fetchData()
                setShowPayment(false)
                setSelectedReceivable(null)
                setPaymentAmount('')
            } else {
                alert(`❌ Error: ${data.error}`)
            }
        } catch (error) {
            alert('Error al registrar pago')
        }
    }

    const getPaymentStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PAID':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            case 'PARTIAL':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            default:
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }
    }

    const getPaymentStatusIcon = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PAID':
                return <CheckCircle className="w-4 h-4" />
            case 'PARTIAL':
                return <Clock className="w-4 h-4" />
            default:
                return <AlertCircle className="w-4 h-4" />
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

    // Filter receivables
    const filteredReceivables = receivables.filter((r) => {
        if (filter === 'all') return true
        return r.paymentStatus.toUpperCase() === filter.toUpperCase()
    })

    // Calculate totals
    const totalPending = receivables
        .filter((r) => r.paymentStatus !== 'PAID')
        .reduce((sum, r) => sum + r.totalUSD, 0)

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Cuentas por Cobrar</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Gestión de facturas y pagos de clientes
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</h3>
                        <DollarSign className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold">{receivables.length}</p>
                    <p className="text-sm text-gray-600">facturas</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Pendiente</h3>
                        <AlertCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <p className="text-2xl font-bold text-red-600">
                        ${formatCurrency(totalPending)}
                    </p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Pagadas</h3>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                        {receivables.filter((r) => r.paymentStatus === 'PAID').length}
                    </p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Parciales</h3>
                        <Clock className="w-5 h-5 text-yellow-500" />
                    </div>
                    <p className="text-2xl font-bold text-yellow-600">
                        {receivables.filter((r) => r.paymentStatus === 'PARTIAL').length}
                    </p>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {(['all', 'pending', 'partial', 'paid'] as const).map((f) => (
                    <Button
                        key={f}
                        variant={filter === f ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setFilter(f)}
                    >
                        {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendientes' : f === 'partial' ? 'Parciales' : 'Pagadas'}
                    </Button>
                ))}
            </div>

            {/* Receivables Table */}
            <Card>
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    </div>
                ) : filteredReceivables.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <p>No hay facturas con este estado</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Factura
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Cliente
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Fecha
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Total
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredReceivables.map((r) => (
                                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {r.invoiceNumber}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium">{r.customer.name}</p>
                                            <p className="text-xs text-gray-500">{r.customer.rif}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {formatDate(r.invoiceDate)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold">
                                            ${formatCurrency(r.totalUSD)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${getPaymentStatusColor(
                                                    r.paymentStatus
                                                )}`}
                                            >
                                                {getPaymentStatusIcon(r.paymentStatus)}
                                                {r.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {r.paymentStatus !== 'PAID' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedReceivable(r)
                                                        setShowPayment(true)
                                                    }}
                                                >
                                                    Registrar Pago
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Payment Modal */}
            {showPayment && selectedReceivable && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">Registrar Pago</h2>
                                <button onClick={() => setShowPayment(false)} className="text-gray-500">
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-600">Factura: {selectedReceivable.invoiceNumber}</p>
                                    <p className="text-sm text-gray-600">Cliente: {selectedReceivable.customer.name}</p>
                                    <p className="text-lg font-bold mt-2">
                                        Total: ${formatCurrency(selectedReceivable.totalUSD)}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Monto a Pagar (USD)</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max={selectedReceivable.totalUSD}
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Método de Pago</label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {paymentMethods.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.name} ({m.currency})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <Button onClick={registerPayment} className="w-full" disabled={!paymentAmount || !paymentMethod}>
                                    Registrar Pago
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}
