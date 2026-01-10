'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, ArrowUpCircle, ArrowDownCircle, RefreshCw, Package, TrendingUp, TrendingDown, Clock } from 'lucide-react'
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

interface Movement {
    id: string
    type: 'ENTRY' | 'EXIT' | 'ADJUSTMENT'
    quantity: number
    previousStock: number
    newStock: number
    reason?: string
    reference?: string
    notes?: string
    createdAt: string
    product: Product
}

interface Stats {
    todayEntries: number
    todayExits: number
    totalMovements: number
}

const REASONS = {
    ENTRY: ['Compra', 'Devolución Cliente', 'Transferencia Entrada', 'Ajuste Positivo', 'Otro'],
    EXIT: ['Venta Manual', 'Daño/Pérdida', 'Devolución Proveedor', 'Transferencia Salida', 'Ajuste Negativo', 'Otro'],
    ADJUSTMENT: ['Conteo Físico', 'Corrección', 'Otro']
}

export default function MovimientosPage() {
    const [movements, setMovements] = useState<Movement[]>([])
    const [stats, setStats] = useState<Stats>({ todayEntries: 0, todayExits: 0, totalMovements: 0 })
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [modalType, setModalType] = useState<'ENTRY' | 'EXIT'>('ENTRY')

    // Products search
    const [products, setProducts] = useState<Product[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [searching, setSearching] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

    // Form
    const [quantity, setQuantity] = useState('')
    const [reason, setReason] = useState('')
    const [reference, setReference] = useState('')
    const [notes, setNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchMovements()
    }, [])

    const fetchMovements = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/inventory')
            const data = await res.json()
            if (data.success) {
                setMovements(data.movements)
                setStats(data.stats)
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const searchProducts = async (term: string) => {
        if (term.length < 2) {
            setProducts([])
            return
        }

        setSearching(true)
        try {
            const res = await fetch(`/api/products?search=${encodeURIComponent(term)}`)
            const data = await res.json()
            if (data.success) {
                setProducts(data.products)
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setSearching(false)
        }
    }

    const openModal = (type: 'ENTRY' | 'EXIT') => {
        setModalType(type)
        setSelectedProduct(null)
        setSearchTerm('')
        setProducts([])
        setQuantity('')
        setReason('')
        setReference('')
        setNotes('')
        setShowModal(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedProduct || !quantity) return

        setSubmitting(true)
        try {
            const res = await fetch('/api/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: selectedProduct.id,
                    type: modalType,
                    quantity: parseInt(quantity),
                    reason,
                    reference,
                    notes
                })
            })

            const data = await res.json()
            if (data.success) {
                setShowModal(false)
                fetchMovements()
            } else {
                alert(data.error || 'Error al registrar movimiento')
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al registrar movimiento')
        } finally {
            setSubmitting(false)
        }
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString('es-VE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getTypeIcon = (type: string) => {
        if (type === 'ENTRY') return <ArrowUpCircle className="w-5 h-5 text-green-500" />
        if (type === 'EXIT') return <ArrowDownCircle className="w-5 h-5 text-red-500" />
        return <RefreshCw className="w-5 h-5 text-blue-500" />
    }

    const getTypeLabel = (type: string) => {
        if (type === 'ENTRY') return 'Entrada'
        if (type === 'EXIT') return 'Salida'
        return 'Ajuste'
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold mb-1">Gestión de Inventario</h1>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Registra entradas y salidas de productos
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                        onClick={() => openModal('ENTRY')}
                        className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                    >
                        <ArrowUpCircle className="w-4 h-4 mr-2" />
                        Entrada
                    </Button>
                    <Button
                        onClick={() => openModal('EXIT')}
                        variant="outline"
                        className="flex-1 sm:flex-none text-red-600 border-red-300 hover:bg-red-50"
                    >
                        <ArrowDownCircle className="w-4 h-4 mr-2" />
                        Salida
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs md:text-sm text-gray-600">Entradas Hoy</p>
                            <p className="text-xl md:text-2xl font-bold text-green-600">{stats.todayEntries}</p>
                        </div>
                        <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs md:text-sm text-gray-600">Salidas Hoy</p>
                            <p className="text-xl md:text-2xl font-bold text-red-600">{stats.todayExits}</p>
                        </div>
                        <TrendingDown className="w-6 h-6 md:w-8 md:h-8 text-red-500" />
                    </div>
                </Card>
                <Card className="p-4 col-span-2 md:col-span-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs md:text-sm text-gray-600">Total Movimientos</p>
                            <p className="text-xl md:text-2xl font-bold">{stats.totalMovements}</p>
                        </div>
                        <Clock className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
                    </div>
                </Card>
            </div>

            {/* Movements List */}
            <Card className="overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="font-semibold">Historial de Movimientos</h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                        <p className="mt-2 text-gray-600">Cargando...</p>
                    </div>
                ) : movements.length === 0 ? (
                    <div className="p-8 text-center">
                        <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-gray-600">No hay movimientos registrados</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {movements.map((mov) => (
                            <div key={mov.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <div className="flex items-start gap-3">
                                    {getTypeIcon(mov.type)}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="font-medium truncate">{mov.product.name}</p>
                                            <span className={`text-sm font-bold ${mov.type === 'ENTRY' ? 'text-green-600' :
                                                    mov.type === 'EXIT' ? 'text-red-600' : 'text-blue-600'
                                                }`}>
                                                {mov.type === 'ENTRY' ? '+' : mov.type === 'EXIT' ? '-' : ''}{mov.quantity}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                            <span>{mov.product.sku}</span>
                                            <span>•</span>
                                            <span>{getTypeLabel(mov.type)}</span>
                                            {mov.reason && (
                                                <>
                                                    <span>•</span>
                                                    <span>{mov.reason}</span>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                                            <span>Stock: {mov.previousStock} → {mov.newStock}</span>
                                            <span>•</span>
                                            <span>{formatDate(mov.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
                    <Card className="w-full sm:max-w-lg sm:mx-4 rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
                        <form onSubmit={handleSubmit}>
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        {modalType === 'ENTRY' ? (
                                            <><ArrowUpCircle className="w-6 h-6 text-green-500" /> Nueva Entrada</>
                                        ) : (
                                            <><ArrowDownCircle className="w-6 h-6 text-red-500" /> Nueva Salida</>
                                        )}
                                    </h2>
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 space-y-4">
                                {/* Product Search */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Producto *</label>
                                    {selectedProduct ? (
                                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{selectedProduct.name}</p>
                                                <p className="text-sm text-gray-500">
                                                    {selectedProduct.sku} • Stock: {selectedProduct.stock}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedProduct(null)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                Cambiar
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input
                                                placeholder="Buscar producto..."
                                                value={searchTerm}
                                                onChange={(e) => {
                                                    setSearchTerm(e.target.value)
                                                    searchProducts(e.target.value)
                                                }}
                                                className="pl-10"
                                            />
                                            {products.length > 0 && (
                                                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                    {products.map((p) => (
                                                        <button
                                                            key={p.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedProduct(p)
                                                                setProducts([])
                                                                setSearchTerm('')
                                                            }}
                                                            className="w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border-b last:border-0"
                                                        >
                                                            <p className="font-medium">{p.name}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {p.sku} • Stock: {p.stock}
                                                            </p>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Quantity */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Cantidad *</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        placeholder="0"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        className="text-2xl font-bold text-center h-14"
                                        required
                                    />
                                    {selectedProduct && modalType === 'EXIT' && (
                                        <p className="text-xs text-gray-500 mt-1 text-center">
                                            Stock disponible: {selectedProduct.stock}
                                        </p>
                                    )}
                                </div>

                                {/* Reason */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Motivo</label>
                                    <select
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {REASONS[modalType].map((r) => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Reference */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Referencia (opcional)</label>
                                    <Input
                                        placeholder="Ej: Factura #123"
                                        value={reference}
                                        onChange={(e) => setReference(e.target.value)}
                                    />
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Notas (opcional)</label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                        rows={2}
                                        placeholder="Notas adicionales..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!selectedProduct || !quantity || submitting}
                                    className={`flex-1 ${modalType === 'ENTRY'
                                            ? 'bg-green-600 hover:bg-green-700'
                                            : 'bg-red-600 hover:bg-red-700'
                                        }`}
                                >
                                    {submitting ? 'Guardando...' : 'Confirmar'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    )
}
