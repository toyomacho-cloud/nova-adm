'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Plus, X, TrendingUp, TrendingDown, Lock } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface CashRegister {
    id: string
    openingBalanceUSD: number
    openingBalanceBS: number
    expectedBalanceUSD: number
    expectedBalanceBS: number
    bcvRate: number
    openedAt: string
    closedAt: string | null
    user: {
        name: string
    }
}

export default function CajaPage() {
    const [cashRegister, setCashRegister] = useState<CashRegister | null>(null)
    const [showOpenModal, setShowOpenModal] = useState(false)
    const [loading, setLoading] = useState(true)
    const [bcvRate, setBcvRate] = useState(0)

    // Form states
    const [openingUSD, setOpeningUSD] = useState('')
    const [openingBS, setOpeningBS] = useState('')

    useEffect(() => {
        fetchCashRegister()
        fetchBCVRate()
    }, [])

    const fetchCashRegister = async () => {
        try {
            const res = await fetch('/api/cash-register')
            const data = await res.json()
            if (data.cashRegister) {
                setCashRegister(data.cashRegister)
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchBCVRate = async () => {
        try {
            const res = await fetch('/api/bcv/rate')
            const data = await res.json()
            if (data.success) {
                setBcvRate(data.rate)
            }
        } catch (error) {
            console.error('Error:', error)
        }
    }

    const handleOpenCashRegister = async () => {
        try {
            const res = await fetch('/api/cash-register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    openingBalanceUSD: parseFloat(openingUSD) || 0,
                    openingBalanceBS: parseFloat(openingBS) || 0
                })
            })

            if (res.ok) {
                setShowOpenModal(false)
                fetchCashRegister()
                setOpeningUSD('')
                setOpeningBS('')
            }
        } catch (error) {
            console.error('Error:', error)
        }
    }

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Caja</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Gestión de caja y ventas diarias
                    </p>
                </div>

                {!cashRegister && (
                    <Button onClick={() => setShowOpenModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Abrir Caja
                    </Button>
                )}
            </div>

            {/* Estado de Caja */}
            {!cashRegister ? (
                <Card className="p-12 text-center">
                    <Lock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h2 className="text-2xl font-bold mb-2">Caja Cerrada</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        No hay una caja abierta actualmente
                    </p>
                    <Button onClick={() => setShowOpenModal(true)}>
                        Abrir Caja del Día
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Balance USD */}
                    <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <span className="text-2xl">💵</span>
                                Dólares (USD)
                            </h3>
                            <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Apertura:</span>
                                <span className="font-medium">${cashRegister.openingBalanceUSD.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Esperado:</span>
                                <span className="font-medium">${cashRegister.expectedBalanceUSD.toFixed(2)}</span>
                            </div>
                            <div className="pt-2 border-t">
                                <div className="flex justify-between">
                                    <span className="font-semibold">Balance Actual:</span>
                                    <span className="text-2xl font-bold text-green-600">
                                        ${cashRegister.expectedBalanceUSD.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Balance BS */}
                    <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <span className="text-2xl">💰</span>
                                Bolívares (Bs)
                            </h3>
                            <TrendingDown className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Apertura:</span>
                                <span className="font-medium">Bs. {cashRegister.openingBalanceBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Esperado:</span>
                                <span className="font-medium">Bs. {cashRegister.expectedBalanceBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="pt-2 border-t">
                                <div className="flex justify-between">
                                    <span className="font-semibold">Balance Actual:</span>
                                    <span className="text-2xl font-bold text-blue-600">
                                        Bs. {cashRegister.expectedBalanceBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Info */}
                    <Card className="p-6 md:col-span-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Abierta por:</p>
                                <p className="font-semibold">{cashRegister.user.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Fecha de apertura:</p>
                                <p className="font-semibold">
                                    {new Date(cashRegister.openedAt).toLocaleString('es-VE')}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Tasa BCV:</p>
                                <p className="font-semibold">Bs. {cashRegister.bcvRate.toFixed(2)} / USD</p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Modal de Apertura */}
            {showOpenModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">Abrir Caja</h2>
                                <button
                                    onClick={() => setShowOpenModal(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* USD Input */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        💵 Efectivo en USD
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={openingUSD}
                                        onChange={(e) => setOpeningUSD(e.target.value)}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Monto en dólares efectivo
                                    </p>
                                </div>

                                {/* BS Input */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        💰 Efectivo en Bs
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={openingBS}
                                        onChange={(e) => setOpeningBS(e.target.value)}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Monto en bolívares efectivo
                                    </p>
                                </div>

                                {/* BCV Rate Display */}
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                        Tasa BCV del día:
                                    </p>
                                    <p className="text-xl font-bold">
                                        Bs. {bcvRate.toFixed(2)} / USD
                                    </p>
                                </div>

                                {/* Totals */}
                                {(openingUSD || openingBS) && (
                                    <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                            Total equivalente:
                                        </p>
                                        <div className="space-y-1">
                                            <p className="font-semibold">
                                                ≈ ${(parseFloat(openingUSD || '0') + (parseFloat(openingBS || '0') / bcvRate)).toFixed(2)} USD
                                            </p>
                                            <p className="font-semibold">
                                                ≈ Bs. {((parseFloat(openingUSD || '0') * bcvRate) + parseFloat(openingBS || '0')).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowOpenModal(false)}
                                    className="flex-1"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleOpenCashRegister}
                                    className="flex-1"
                                >
                                    Abrir Caja ✓
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}
