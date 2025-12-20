'use client'

import { useState, useEffect } from 'react'
import { CreditCard, TrendingUp, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function CasheaDashboardPage() {
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

    useEffect(() => {
        fetchTransactions()
    }, [filter])

    const fetchTransactions = async () => {
        try {
            setLoading(true)
            const url = filter === 'all'
                ? '/api/cashea/create-payment'
                : `/api/cashea/create-payment?status=${filter}`

            const res = await fetch(url)
            const data = await res.json()

            if (data.success) {
                setTransactions(data.transactions)
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (value: number, currency: string = 'USD') =>
        `${currency === 'USD' ? '$' : 'Bs.'} ${new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2
        }).format(value)}`

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('es-VE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            case 'rejected':
            case 'expired':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved':
                return <CheckCircle className="w-4 h-4" />
            case 'pending':
                return <Clock className="w-4 h-4" />
            default:
                return <XCircle className="w-4 h-4" />
        }
    }

    // Calculate metrics
    const metrics = {
        total: transactions.length,
        approved: transactions.filter((t) => t.status === 'approved').length,
        pending: transactions.filter((t) => t.status === 'pending').length,
        totalAmount: transactions
            .filter((t) => t.status === 'approved')
            .reduce((sum, t) => sum + t.amount, 0),
        totalCommission: transactions
            .filter((t) => t.status === 'approved')
            .reduce((sum, t) => sum + (t.commission || 0), 0),
        netAmount: transactions
            .filter((t) => t.status === 'approved')
            .reduce((sum, t) => sum + (t.netAmount || t.amount), 0),
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Dashboard Cashea</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Pagos, comisiones y conciliación
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Total Transacciones
                        </h3>
                        <CreditCard className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-3xl font-bold">{metrics.total}</p>
                    <p className="text-sm text-gray-600 mt-1">
                        {metrics.approved} aprobadas
                    </p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Total Cobrado
                        </h3>
                        <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-3xl font-bold text-green-600">
                        {formatCurrency(metrics.totalAmount)}
                    </p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Comisiones
                        </h3>
                        <DollarSign className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-3xl font-bold text-orange-600">
                        {formatCurrency(metrics.totalCommission)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                        {metrics.totalAmount > 0
                            ? ((metrics.totalCommission / metrics.totalAmount) * 100).toFixed(1)
                            : 0}% promedio
                    </p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Neto Recibido
                        </h3>
                        <DollarSign className="w-5 h-5 text-purple-500" />
                    </div>
                    <p className="text-3xl font-bold text-purple-600">
                        {formatCurrency(metrics.netAmount)}
                    </p>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {(['all', 'approved', 'pending', 'rejected'] as const).map((f) => (
                    <Button
                        key={f}
                        variant={filter === f ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setFilter(f)}
                    >
                        {f === 'all' ? 'Todas' : f === 'approved' ? 'Aprobadas' : f === 'pending' ? 'Pendientes' : 'Rechazadas'}
                    </Button>
                ))}
            </div>

            {/* Transactions Table */}
            <Card>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-bold">Transacciones Cashea</h2>
                </div>
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <p>No hay transacciones</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Referencia
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Cliente
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Fecha
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Monto
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Comisión
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Neto
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                        Estado
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {transactions.map((t) => (
                                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <p className="text-sm font-medium">{t.reference}</p>
                                                <p className="text-xs text-gray-500">{t.paymentId}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium">{t.sale?.customer.name || 'N/A'}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {formatDate(t.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {formatCurrency(t.amount, t.currency)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-orange-600">
                                            {t.commission ? formatCurrency(t.commission, t.currency) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-purple-600">
                                            {t.netAmount ? formatCurrency(t.netAmount, t.currency) : formatCurrency(t.amount, t.currency)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${getStatusColor(
                                                    t.status
                                                )}`}
                                            >
                                                {getStatusIcon(t.status)}
                                                {t.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Info Card */}
            <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                    <CreditCard className="w-6 h-6 text-blue-600 mt-1" />
                    <div>
                        <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
                            Cashea - Pasarela de Pagos Venezuela
                        </h3>
                        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                            <li>• Los pagos se confirman automáticamente vía webhook</li>
                            <li>• Las comisiones se calculan al aprobar el pago</li>
                            <li>• El neto es lo que recibes en tu cuenta Cashea</li>
                            <li>• Los pagos pendientes expiran en 24 horas</li>
                        </ul>
                    </div>
                </div>
            </Card>
        </div>
    )
}
