'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
    DollarSign,
    Plus,
    Minus,
    Lock,
    Unlock,
    TrendingUp,
    TrendingDown,
    Receipt,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function CajaPage() {
    const [cashRegisterOpen, setCashRegisterOpen] = useState(true)
    const [showAddTransaction, setShowAddTransaction] = useState(false)

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold mb-2">Caja</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Control de efectivo y transacciones
                    </p>
                </div>

                <Button
                    variant={cashRegisterOpen ? 'danger' : 'primary'}
                    onClick={() => setCashRegisterOpen(!cashRegisterOpen)}
                >
                    {cashRegisterOpen ? (
                        <>
                            <Lock className="w-5 h-5 mr-2" />
                            Cerrar Caja
                        </>
                    ) : (
                        <>
                            <Unlock className="w-5 h-5 mr-2" />
                            Abrir Caja
                        </>
                    )}
                </Button>
            </div>

            {/* Status & Balance */}
            <div className="grid md:grid-cols-3 gap-6">
                <Card variant="glass" className="md:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-display font-semibold">
                            Estado de Caja
                        </h2>
                        <Badge variant={cashRegisterOpen ? 'success' : 'danger'}>
                            {cashRegisterOpen ? 'Abierta' : 'Cerrada'}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-gradient-to-br from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20 rounded-xl">
                            <div className="text-sm text-success-700 dark:text-success-400 mb-1">
                                Saldo Inicial
                            </div>
                            <div className="text-2xl font-bold text-success-900 dark:text-success-100">
                                {formatCurrency(10000)}
                            </div>
                        </div>

                        <div className="p-4 bg-gradient-to-br from-info-50 to-info-100 dark:from-info-900/20 dark:to-info-800/20 rounded-xl">
                            <div className="text-sm text-info-700 dark:text-info-400 mb-1">
                                Ingresos
                            </div>
                            <div className="text-2xl font-bold text-info-900 dark:text-info-100">
                                {formatCurrency(45280.50)}
                            </div>
                        </div>

                        <div className="p-4 bg-gradient-to-br from-warning-50 to-warning-100 dark:from-warning-900/20 dark:to-warning-800/20 rounded-xl">
                            <div className="text-sm text-warning-700 dark:text-warning-400 mb-1">
                                Egresos
                            </div>
                            <div className="text-2xl font-bold text-warning-900 dark:text-warning-100">
                                {formatCurrency(12450.00)}
                            </div>
                        </div>

                        <div className="p-4 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl">
                            <div className="text-sm text-primary-700 dark:text-primary-400 mb-1">
                                Saldo Actual
                            </div>
                            <div className="text-2xl font-bold text-primary-900 dark:text-primary-100">
                                {formatCurrency(42830.50)}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card variant="glass">
                    <h3 className="font-semibold mb-4">Acciones Rápidas</h3>

                    <div className="space-y-2">
                        <Button
                            variant="primary"
                            className="w-full justify-start"
                            onClick={() => setShowAddTransaction(true)}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Entrada de Efectivo
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => setShowAddTransaction(true)}
                        >
                            <Minus className="w-4 h-4 mr-2" />
                            Salida de Efectivo
                        </Button>

                        <Button variant="ghost" className="w-full justify-start">
                            <Receipt className="w-4 h-4 mr-2" />
                            Ver Recibo
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Transactions */}
            <Card variant="glass">
                <h2 className="text-xl font-display font-semibold mb-6">
                    Transacciones de Hoy
                </h2>

                <div className="overflow-x-auto">
                    <table className="table-modern">
                        <thead>
                            <tr>
                                <th>Hora</th>
                                <th>Tipo</th>
                                <th>Descripción</th>
                                <th>Método</th>
                                <th className="text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((transaction, index) => (
                                <tr key={index}>
                                    <td>{transaction.time}</td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            {transaction.type === 'in' ? (
                                                <TrendingUp className="w-4 h-4 text-success-600" />
                                            ) : (
                                                <TrendingDown className="w-4 h-4 text-danger-600" />
                                            )}
                                            <span>{transaction.type === 'in' ? 'Entrada' : 'Salida'}</span>
                                        </div>
                                    </td>
                                    <td>{transaction.description}</td>
                                    <td>
                                        <Badge variant="default">{transaction.method}</Badge>
                                    </td>
                                    <td className={`text-right font-semibold ${transaction.type === 'in' ? 'text-success-600' : 'text-danger-600'
                                        }`}>
                                        {transaction.type === 'in' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}

const transactions = [
    { time: '14:30', type: 'in', description: 'Venta #125', method: 'Efectivo', amount: 15420.50 },
    { time: '13:15', type: 'in', description: 'Venta #124', method: 'Transferencia', amount: 8750.00 },
    { time: '12:00', type: 'out', description: 'Pago a proveedor', method: 'Efectivo', amount: 5200.00 },
    { time: '11:30', type: 'in', description: 'Venta #123', method: 'Efectivo', amount: 12300.25 },
    { time: '10:45', type: 'out', description: 'Gastos operativos', method: 'Efectivo', amount: 850.50 },
]
