'use client'

import { useState, useEffect } from 'react'
import { DollarSign, CreditCard, Smartphone, Building2, Bitcoin, CheckCircle2, XCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface PaymentMethod {
    id: string
    name: string
    type: string
    currency: string
    isActive: boolean
}

const typeIcons: Record<string, any> = {
    CASH: DollarSign,
    DIGITAL_TRANSFER: Smartphone,
    CRYPTO: Bitcoin,
    BANK_TRANSFER: Building2,
    DEBIT_CARD: CreditCard,
    MOBILE_PAYMENT: Smartphone,
    default: CreditCard
}

const typeLabels: Record<string, string> = {
    CASH: 'Efectivo',
    DIGITAL_TRANSFER: 'Transferencia Digital',
    CRYPTO: 'Criptomoneda',
    BANK_TRANSFER: 'Transferencia Bancaria',
    DEBIT_CARD: 'Punto de Venta',
    MOBILE_PAYMENT: 'Pago Móvil'
}

export default function PaymentMethodsPage() {
    const [methods, setMethods] = useState<{ USD: PaymentMethod[], BS: PaymentMethod[] }>({ USD: [], BS: [] })
    const [loading, setLoading] = useState(true)

    const fetchMethods = async () => {
        try {
            const res = await fetch('/api/payment-methods')
            const data = await res.json()
            if (data.success) {
                setMethods(data.grouped)
            }
        } catch (error) {
            console.error('Error fetching methods:', error)
        } finally {
            setLoading(false)
        }
    }

    const toggleMethod = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch('/api/payment-methods', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isActive: !currentStatus })
            })

            if (res.ok) {
                fetchMethods() // Recargar
            }
        } catch (error) {
            console.error('Error toggling method:', error)
        }
    }

    useEffect(() => {
        fetchMethods()
    }, [])

    const MethodCard = ({ method }: { method: PaymentMethod }) => {
        const Icon = typeIcons[method.type] || typeIcons.default
        const currencySymbol = method.currency === 'USD' ? '💵' : '💰'

        return (
            <Card className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${method.isActive ? 'bg-primary-100 dark:bg-primary-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                            <Icon className={`w-5 h-5 ${method.isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{currencySymbol}</span>
                                <h3 className="font-semibold">{method.name}</h3>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
                                    {method.currency}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {typeLabels[method.type] || method.type}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => toggleMethod(method.id, method.isActive)}
                        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors"
                        style={{
                            backgroundColor: method.isActive ? 'rgb(34 197 94 / 0.1)' : 'rgb(239 68 68 / 0.1)',
                            color: method.isActive ? 'rgb(22 163 74)' : 'rgb(220 38 38)'
                        }}
                    >
                        {method.isActive ? (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                Activo
                            </>
                        ) : (
                            <>
                                <XCircle className="w-4 h-4" />
                                Inactivo
                            </>
                        )}
                    </button>
                </div>
            </Card>
        )
    }

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2">Métodos de Pago</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Gestiona los métodos de pago disponibles para tu empresa
                </p>
            </div>

            {/* USD Methods */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <h2 className="text-xl font-semibold">Moneda Extranjera (USD)</h2>
                    <span className="text-sm text-gray-500">
                        {methods.USD.filter(m => m.isActive).length} de {methods.USD.length} activos
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {methods.USD.map(method => (
                        <MethodCard key={method.id} method={method} />
                    ))}
                </div>
            </div>

            {/* BS Methods */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <h2 className="text-xl font-semibold">Moneda Nacional (Bs)</h2>
                    <span className="text-sm text-gray-500">
                        {methods.BS.filter(m => m.isActive).length} de {methods.BS.length} activos
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {methods.BS.map(method => (
                        <MethodCard key={method.id} method={method} />
                    ))}
                </div>
            </div>
        </div>
    )
}
