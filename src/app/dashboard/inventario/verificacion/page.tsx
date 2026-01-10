'use client'

import { useState, useEffect } from 'react'
import { ClipboardCheck, Play, CheckCircle2, XCircle, AlertTriangle, RotateCcw, ChevronRight, Package } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Product {
    id: string
    sku: string
    name: string
    category?: string
    location?: string
    stock: number
}

interface CheckItem {
    id: string
    productId: string
    expectedStock: number
    actualStock: number | null
    isMatch: boolean | null
    notes?: string
    checkedAt?: string
    product: Product
}

interface InventoryCheck {
    id: string
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
    totalItems: number
    checkedItems: number
    matchedItems: number
    discrepancies: number
    createdAt: string
    completedAt?: string
    items: CheckItem[]
}

interface CheckHistory {
    id: string
    status: string
    totalItems: number
    checkedItems: number
    matchedItems: number
    discrepancies: number
    createdAt: string
    completedAt?: string
}

export default function VerificacionPage() {
    const [activeCheck, setActiveCheck] = useState<InventoryCheck | null>(null)
    const [history, setHistory] = useState<CheckHistory[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)

    // Current verification state
    const [currentIndex, setCurrentIndex] = useState(0)
    const [actualStock, setActualStock] = useState('')
    const [notes, setNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)

    // New check options
    const [itemCount, setItemCount] = useState(10)
    const [showSummary, setShowSummary] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            // Check for active verification
            const activeRes = await fetch('/api/inventory/check?active=true')
            const activeData = await activeRes.json()

            if (activeData.success && activeData.check) {
                setActiveCheck(activeData.check)
                // Find first unchecked item
                const uncheckedIndex = activeData.check.items.findIndex(
                    (item: CheckItem) => item.actualStock === null
                )
                setCurrentIndex(uncheckedIndex >= 0 ? uncheckedIndex : 0)
            }

            // Get history
            const historyRes = await fetch('/api/inventory/check')
            const historyData = await historyRes.json()
            if (historyData.success) {
                setHistory(historyData.checks.filter((c: CheckHistory) => c.status === 'COMPLETED'))
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const startNewCheck = async () => {
        setCreating(true)
        try {
            const res = await fetch('/api/inventory/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemCount })
            })
            const data = await res.json()
            if (data.success) {
                setActiveCheck(data.check)
                setCurrentIndex(0)
                setShowSummary(false)
            } else {
                alert(data.error || 'Error al crear verificación')
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al crear verificación')
        } finally {
            setCreating(false)
        }
    }

    const submitItem = async (skip = false) => {
        if (!activeCheck) return
        const currentItem = activeCheck.items[currentIndex]
        if (!currentItem) return

        if (!skip && !actualStock) {
            alert('Ingresa la cantidad contada')
            return
        }

        setSubmitting(true)
        try {
            const res = await fetch(`/api/inventory/check/${activeCheck.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemId: currentItem.id,
                    actualStock: skip ? currentItem.expectedStock : parseInt(actualStock),
                    notes: skip ? 'Saltado' : notes
                })
            })

            const data = await res.json()
            if (data.success) {
                setActiveCheck(data.check)

                // Move to next unchecked item
                const nextIndex = data.check.items.findIndex(
                    (item: CheckItem, idx: number) => idx > currentIndex && item.actualStock === null
                )

                if (nextIndex >= 0) {
                    setCurrentIndex(nextIndex)
                    setActualStock('')
                    setNotes('')
                } else {
                    // All items checked, show summary
                    setShowSummary(true)
                }
            } else {
                alert(data.error || 'Error')
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const completeCheck = async () => {
        if (!activeCheck) return

        try {
            const res = await fetch(`/api/inventory/check/${activeCheck.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'complete' })
            })

            const data = await res.json()
            if (data.success) {
                setActiveCheck(null)
                setShowSummary(false)
                fetchData()
            }
        } catch (error) {
            console.error('Error:', error)
        }
    }

    const cancelCheck = async () => {
        if (!activeCheck) return
        if (!confirm('¿Cancelar esta verificación?')) return

        try {
            await fetch(`/api/inventory/check/${activeCheck.id}`, {
                method: 'DELETE'
            })
            setActiveCheck(null)
            setShowSummary(false)
            fetchData()
        } catch (error) {
            console.error('Error:', error)
        }
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('es-VE', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
                    <p className="mt-3 text-gray-600">Cargando...</p>
                </div>
            </div>
        )
    }

    // Show summary after completing all items
    if (activeCheck && showSummary) {
        const discrepancyItems = activeCheck.items.filter(i => i.isMatch === false)

        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
                <Card className="max-w-lg mx-auto">
                    <div className="p-6 text-center border-b">
                        <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
                        <h1 className="text-2xl font-bold mb-2">Verificación Completada</h1>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                <p className="text-3xl font-bold text-green-600">{activeCheck.matchedItems}</p>
                                <p className="text-sm text-gray-600">Coinciden</p>
                            </div>
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                                <p className="text-3xl font-bold text-red-600">{activeCheck.discrepancies}</p>
                                <p className="text-sm text-gray-600">Discrepancias</p>
                            </div>
                        </div>

                        {discrepancyItems.length > 0 && (
                            <div className="mt-6">
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                                    Diferencias Encontradas
                                </h3>
                                <div className="space-y-2">
                                    {discrepancyItems.map(item => (
                                        <div key={item.id} className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                            <p className="font-medium">{item.product.name}</p>
                                            <p className="text-sm text-gray-600">
                                                Sistema: {item.expectedStock} → Conteo: {item.actualStock}
                                                <span className="ml-2 font-bold text-red-600">
                                                    ({(item.actualStock || 0) - item.expectedStock > 0 ? '+' : ''}
                                                    {(item.actualStock || 0) - item.expectedStock})
                                                </span>
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Button onClick={completeCheck} className="w-full mt-6 h-14 text-lg">
                            Finalizar
                        </Button>
                    </div>
                </Card>
            </div>
        )
    }

    // Active verification - card by card
    if (activeCheck) {
        const currentItem = activeCheck.items[currentIndex]
        const progress = (activeCheck.checkedItems / activeCheck.totalItems) * 100

        return (
            <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
                {/* Progress Header */}
                <div className="max-w-lg mx-auto mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                            {activeCheck.checkedItems + 1} de {activeCheck.totalItems}
                        </span>
                        <button onClick={cancelCheck} className="text-sm text-red-500">
                            Cancelar
                        </button>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-primary-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Current Product Card */}
                {currentItem && (
                    <Card className="max-w-lg mx-auto overflow-hidden">
                        <div className="p-6 bg-gradient-to-br from-primary-500 to-primary-600 text-white">
                            <p className="text-sm opacity-80 mb-1">{currentItem.product.sku}</p>
                            <h2 className="text-2xl font-bold mb-2">{currentItem.product.name}</h2>
                            {currentItem.product.location && (
                                <p className="text-sm opacity-80">
                                    📍 {currentItem.product.location}
                                </p>
                            )}
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Expected Stock */}
                            <div className="text-center">
                                <p className="text-sm text-gray-600 mb-1">Stock en sistema</p>
                                <p className="text-5xl font-bold text-gray-400">
                                    {currentItem.expectedStock}
                                </p>
                            </div>

                            {/* Actual Stock Input */}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-center">
                                    ¿Cuántos hay realmente?
                                </label>
                                <Input
                                    type="number"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    min="0"
                                    placeholder="0"
                                    value={actualStock}
                                    onChange={(e) => setActualStock(e.target.value)}
                                    className="text-4xl font-bold text-center h-20"
                                    autoFocus
                                />
                            </div>

                            {/* Notes (optional) */}
                            <div>
                                <Input
                                    placeholder="Notas (opcional)"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="text-center"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => submitItem(true)}
                                    disabled={submitting}
                                    className="flex-1 h-14"
                                >
                                    Saltar
                                </Button>
                                <Button
                                    onClick={() => submitItem(false)}
                                    disabled={submitting || !actualStock}
                                    className="flex-[2] h-14 text-lg"
                                >
                                    {submitting ? 'Guardando...' : 'Confirmar ✓'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Quick Stats */}
                <div className="max-w-lg mx-auto mt-4 flex gap-4 text-center text-sm">
                    <div className="flex-1 p-3 bg-white dark:bg-gray-800 rounded-xl">
                        <p className="text-green-600 font-bold">{activeCheck.matchedItems}</p>
                        <p className="text-gray-500">OK</p>
                    </div>
                    <div className="flex-1 p-3 bg-white dark:bg-gray-800 rounded-xl">
                        <p className="text-red-600 font-bold">{activeCheck.discrepancies}</p>
                        <p className="text-gray-500">Diferencias</p>
                    </div>
                </div>
            </div>
        )
    }

    // No active check - Start screen
    return (
        <div className="min-h-screen bg-gradient-to-b from-primary-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <div className="max-w-lg mx-auto space-y-6">
                {/* Header */}
                <div className="text-center pt-8 pb-4">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <ClipboardCheck className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Verificación de Stock</h1>
                    <p className="text-gray-600">Verifica productos aleatorios rápidamente</p>
                </div>

                {/* Item Count Selector */}
                <Card className="p-6">
                    <label className="block text-sm font-medium mb-3 text-center">
                        ¿Cuántos productos verificar?
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {[5, 10, 15, 20].map(count => (
                            <button
                                key={count}
                                onClick={() => setItemCount(count)}
                                className={`p-4 rounded-xl font-bold text-lg transition-all ${itemCount === count
                                        ? 'bg-primary-500 text-white shadow-lg scale-105'
                                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200'
                                    }`}
                            >
                                {count}
                            </button>
                        ))}
                    </div>

                    <Button
                        onClick={startNewCheck}
                        disabled={creating}
                        className="w-full mt-6 h-16 text-xl"
                    >
                        {creating ? (
                            'Cargando...'
                        ) : (
                            <>
                                <Play className="w-6 h-6 mr-2" />
                                Iniciar Verificación
                            </>
                        )}
                    </Button>
                </Card>

                {/* History */}
                {history.length > 0 && (
                    <Card className="overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="font-semibold">Verificaciones Anteriores</h2>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {history.slice(0, 5).map(check => (
                                <div key={check.id} className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">{formatDate(check.createdAt)}</p>
                                        <p className="font-medium">{check.totalItems} productos</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-green-600 text-sm">{check.matchedItems} ✓</p>
                                            {check.discrepancies > 0 && (
                                                <p className="text-red-600 text-sm">{check.discrepancies} ⚠</p>
                                            )}
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}
            </div>
        </div>
    )
}
