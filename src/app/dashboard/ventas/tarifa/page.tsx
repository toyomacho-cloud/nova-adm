'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { RefreshCw, DollarSign, TrendingUp, Save, Calculator } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Product {
    id: string
    sku: string
    name: string
    reference?: string
    costUSD: number
    priceUSD: number
    multiplier: number
}

interface Rates {
    bcv: number
    binance: number
}

export default function TarifaPage() {
    const { data: session } = useSession()
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const [rates, setRates] = useState<Rates>({ bcv: 0, binance: 0 })
    const [loadingRates, setLoadingRates] = useState(true)

    // Multipliers being edited (key: productId, value: multiplier string)
    const [editedMultipliers, setEditedMultipliers] = useState<Record<string, string>>({})

    useEffect(() => {
        fetchProducts()
        fetchRates()
    }, [])

    const fetchProducts = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/products?limit=500')
            const data = await res.json()
            if (data.success) {
                // Calculate multiplier from cost and price
                const productsWithMultiplier = data.products.map((p: any) => ({
                    ...p,
                    multiplier: p.costUSD > 0 ? parseFloat((p.priceUSD / p.costUSD).toFixed(2)) : 1,
                }))
                setProducts(productsWithMultiplier)
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchRates = async () => {
        try {
            setLoadingRates(true)

            // Fetch both rates in parallel
            const [bcvRes, binanceRes] = await Promise.all([
                fetch('/api/exchange-rate'),
                fetch('/api/rates/binance'),
            ])

            const bcvData = await bcvRes.json()
            const binanceData = await binanceRes.json()

            setRates({
                bcv: bcvData.rate || 0,
                binance: binanceData.rate || 0,
            })
        } catch (error) {
            console.error('Error fetching rates:', error)
        } finally {
            setLoadingRates(false)
        }
    }

    const handleMultiplierChange = (productId: string, value: string) => {
        setEditedMultipliers(prev => ({
            ...prev,
            [productId]: value,
        }))
    }

    const saveMultiplier = async (product: Product) => {
        const newMultiplier = parseFloat(editedMultipliers[product.id] || product.multiplier.toString())
        if (isNaN(newMultiplier) || newMultiplier < 1) {
            alert('El multiplicador debe ser al menos 1')
            return
        }

        setSaving(product.id)
        try {
            // Calculate new priceUSD based on costUSD * multiplier
            const newPriceUSD = product.costUSD * newMultiplier

            const res = await fetch(`/api/products/${product.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceUSD: newPriceUSD.toFixed(2) }),
            })

            const data = await res.json()
            if (data.success) {
                // Update local state
                setProducts(prev => prev.map(p =>
                    p.id === product.id
                        ? { ...p, priceUSD: newPriceUSD, multiplier: newMultiplier }
                        : p
                ))
                // Clear edited state
                setEditedMultipliers(prev => {
                    const next = { ...prev }
                    delete next[product.id]
                    return next
                })
            } else {
                alert('Error al guardar: ' + data.error)
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al guardar')
        } finally {
            setSaving(null)
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value)
    }

    // Calculate Tarifa 1 (USD price) and Tarifa 2 (BCV reference)
    const calculateTarifa = (product: Product) => {
        const multiplier = parseFloat(editedMultipliers[product.id] || product.multiplier.toString()) || 1
        const tarifa1 = product.costUSD * multiplier // Precio en USD/USDT
        const totalBs = tarifa1 * rates.binance // Total Bs necesarios
        const tarifa2 = rates.bcv > 0 ? totalBs / rates.bcv : 0 // Precio referencia BCV

        return { tarifa1, totalBs, tarifa2, multiplier }
    }

    const brecha = rates.bcv > 0 ? ((rates.binance / rates.bcv - 1) * 100).toFixed(1) : '0'

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">💱 Tarifa - Protección Cambiaria</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Ajusta precios para proteger contra la brecha cambiaria
                    </p>
                </div>
                <Button onClick={() => { fetchProducts(); fetchRates() }} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Actualizar
                </Button>
            </div>

            {/* Rates Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-600 dark:text-green-400">Tasa BCV</p>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                                {loadingRates ? '...' : `Bs. ${formatCurrency(rates.bcv)}`}
                            </p>
                        </div>
                        <DollarSign className="w-8 h-8 text-green-500" />
                    </div>
                </Card>

                <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-yellow-600 dark:text-yellow-400">Tasa Binance</p>
                            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                                {loadingRates ? '...' : `Bs. ${formatCurrency(rates.binance)}`}
                            </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-yellow-500" />
                    </div>
                </Card>

                <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-red-600 dark:text-red-400">Brecha Cambiaria</p>
                            <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                                {loadingRates ? '...' : `+${brecha}%`}
                            </p>
                        </div>
                        <Calculator className="w-8 h-8 text-red-500" />
                    </div>
                </Card>

                <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-600 dark:text-blue-400">Productos</p>
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                {products.length}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Legend */}
            <Card className="p-4 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex flex-wrap gap-6 text-sm">
                    <div>
                        <span className="font-semibold text-green-600">Tarifa 1:</span> Precio USD/USDT (efectivo)
                    </div>
                    <div>
                        <span className="font-semibold text-blue-600">Total Bs:</span> Lo que debes recibir en Bs
                    </div>
                    <div>
                        <span className="font-semibold text-purple-600">Tarifa 2:</span> Precio ref. BCV (para factura)
                    </div>
                </div>
            </Card>

            {/* Products Table */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    <p className="mt-2 text-gray-600">Cargando productos...</p>
                </div>
            ) : (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-gray-800 border-b">
                                    <th className="text-left px-3 py-2">REF</th>
                                    <th className="text-left px-3 py-2">Producto</th>
                                    <th className="text-right px-3 py-2">Costo USD</th>
                                    <th className="text-center px-3 py-2 bg-amber-100 dark:bg-amber-900/30">% Ganancia</th>
                                    <th className="text-right px-3 py-2 bg-green-100 dark:bg-green-900/30">Tarifa 1 (USD)</th>
                                    <th className="text-right px-3 py-2 bg-blue-100 dark:bg-blue-900/30">Total Bs</th>
                                    <th className="text-right px-3 py-2 bg-purple-100 dark:bg-purple-900/30">Tarifa 2 (BCV $)</th>
                                    <th className="text-center px-3 py-2">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => {
                                    const { tarifa1, totalBs, tarifa2, multiplier } = calculateTarifa(product)
                                    const isEdited = editedMultipliers[product.id] !== undefined
                                    const percentGain = ((multiplier - 1) * 100).toFixed(0)

                                    return (
                                        <tr
                                            key={product.id}
                                            className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                        >
                                            <td className="px-3 py-2 font-mono text-xs text-gray-600">
                                                {product.reference || product.sku}
                                            </td>
                                            <td className="px-3 py-2 font-medium truncate max-w-[200px]">
                                                {product.name}
                                            </td>
                                            <td className="px-3 py-2 text-right text-gray-600">
                                                ${formatCurrency(product.costUSD)}
                                            </td>
                                            <td className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Input
                                                        type="number"
                                                        min="100"
                                                        step="10"
                                                        className="w-20 text-center text-sm"
                                                        value={editedMultipliers[product.id] ?? (multiplier * 100).toFixed(0)}
                                                        onChange={(e) => handleMultiplierChange(product.id, (parseFloat(e.target.value) / 100).toString())}
                                                        placeholder="300"
                                                    />
                                                    <span className="text-xs text-gray-500">%</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-right font-semibold text-green-600 bg-green-50 dark:bg-green-900/20">
                                                ${formatCurrency(tarifa1)}
                                            </td>
                                            <td className="px-3 py-2 text-right font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20">
                                                Bs. {formatCurrency(totalBs)}
                                            </td>
                                            <td className="px-3 py-2 text-right font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/20">
                                                ${formatCurrency(tarifa2)}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                {isEdited && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => saveMultiplier(product)}
                                                        disabled={saving === product.id}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        {saving === product.id ? (
                                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Save className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    )
}
