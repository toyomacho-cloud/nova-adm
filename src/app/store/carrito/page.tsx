'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface CartItem {
    id: string
    name: string
    sku: string
    priceUSD: number
    priceBs: number
    image?: string
    quantity: number
}

export default function CartPage() {
    const router = useRouter()
    const [cart, setCart] = useState<CartItem[]>([])

    useEffect(() => {
        loadCart()
    }, [])

    const loadCart = () => {
        const cartData = JSON.parse(localStorage.getItem('cart') || '[]')
        setCart(cartData)
    }

    const updateQuantity = (id: string, newQuantity: number) => {
        if (newQuantity < 1) return

        const updatedCart = cart.map((item) =>
            item.id === id ? { ...item, quantity: newQuantity } : item
        )
        setCart(updatedCart)
        localStorage.setItem('cart', JSON.stringify(updatedCart))
        window.dispatchEvent(new Event('cartUpdated'))
    }

    const removeItem = (id: string) => {
        const updatedCart = cart.filter((item) => item.id !== id)
        setCart(updatedCart)
        localStorage.setItem('cart', JSON.stringify(updatedCart))
        window.dispatchEvent(new Event('cartUpdated'))
    }

    const clearCart = () => {
        if (confirm('¿Estás seguro de vaciar el carrito?')) {
            setCart([])
            localStorage.removeItem('cart')
            window.dispatchEvent(new Event('cartUpdated'))
        }
    }

    const calculateTotals = () => {
        const subtotalUSD = cart.reduce((sum, item) => sum + item.priceUSD * item.quantity, 0)
        const subtotalBs = cart.reduce((sum, item) => sum + item.priceBs * item.quantity, 0)
        const shippingUSD = subtotalUSD >= 50 ? 0 : 5
        const shippingBs = shippingUSD * (subtotalBs / subtotalUSD || 0)
        const taxUSD = (subtotalUSD + shippingUSD) * 0.16
        const taxBs = (subtotalBs + shippingBs) * 0.16
        const totalUSD = subtotalUSD + shippingUSD + taxUSD
        const totalBs = subtotalBs + shippingBs + taxBs

        return { subtotalUSD, subtotalBs, shippingUSD, shippingBs, taxUSD, taxBs, totalUSD, totalBs }
    }

    const totals = calculateTotals()
    const formatCurrency = (value: number) => value.toFixed(2)

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow">
                <div className="container mx-auto px-4 py-4">
                    <Link href="/store" className="flex items-center gap-2 text-primary-500 hover:text-primary-600">
                        <ArrowLeft className="w-5 h-5" />
                        Continuar comprando
                    </Link>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">Carrito de Compras</h1>

                {cart.length === 0 ? (
                    <Card className="p-12 text-center">
                        <ShoppingCart className="w-24 h-24 mx-auto mb-6 text-gray-300" />
                        <h2 className="text-2xl font-bold mb-4">Tu carrito está vacío</h2>
                        <p className="text-gray-600 mb-6">
                            Agrega productos para empezar a comprar
                        </p>
                        <Button size="lg" onClick={() => router.push('/store')}>
                            Explorar Productos
                        </Button>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Items */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold">
                                    Productos ({cart.reduce((sum, item) => sum + item.quantity, 0)})
                                </h2>
                                <Button variant="outline" size="sm" onClick={clearCart}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Vaciar Carrito
                                </Button>
                            </div>

                            {cart.map((item) => (
                                <Card key={item.id} className="p-4">
                                    <div className="flex gap-4">
                                        {/* Image */}
                                        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded flex-shrink-0">
                                            {item.image ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover rounded"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ShoppingCart className="w-12 h-12 text-gray-300" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <Link
                                                        href={`/store/productos/${item.id}`}
                                                        className="font-semibold hover:text-primary-500 transition"
                                                    >
                                                        {item.name}
                                                    </Link>
                                                    <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                                                </div>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-red-500 hover:text-red-600 p-2"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>

                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                {/* Price */}
                                                <div>
                                                    <div className="text-xl font-bold text-primary-600">
                                                        ${formatCurrency(item.priceUSD)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        Bs. {item.priceBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                                    </div>
                                                </div>

                                                {/* Quantity */}
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                                    >
                                                        <Minus className="w-5 h-5" />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                                        className="w-16 text-center px-2 py-1 border border-gray-300 dark:border-gray-600 rounded"
                                                    />
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                    </button>
                                                </div>

                                                {/* Subtotal */}
                                                <div className="text-right">
                                                    <div className="font-bold text-lg">
                                                        ${formatCurrency(item.priceUSD * item.quantity)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        Bs. {(item.priceBs * item.quantity).toLocaleString('es-VE', {
                                                            minimumFractionDigits: 2,
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Summary */}
                        <div className="lg:col-span-1">
                            <Card className="p-6 sticky top-4">
                                <h2 className="text-xl font-bold mb-6">Resumen del Pedido</h2>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                                        <span className="font-medium">${formatCurrency(totals.subtotalUSD)}</span>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Envío:</span>
                                        <span className="font-medium">
                                            {totals.shippingUSD === 0 ? (
                                                <span className="text-green-600">GRATIS</span>
                                            ) : (
                                                `$${formatCurrency(totals.shippingUSD)}`
                                            )}
                                        </span>
                                    </div>

                                    {totals.shippingUSD > 0 && (
                                        <p className="text-xs text-gray-500">
                                            Envío gratis en compras mayores a $50
                                        </p>
                                    )}

                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">IVA (16%):</span>
                                        <span className="font-medium">${formatCurrency(totals.taxUSD)}</span>
                                    </div>

                                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-lg font-bold">Total:</span>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-primary-600">
                                                    ${formatCurrency(totals.totalUSD)}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Bs. {totals.totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Link href="/store/checkout">
                                    <Button size="lg" className="w-full mb-3">
                                        Proceder al Pago
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </Link>

                                <Link href="/store">
                                    <Button variant="outline" className="w-full">
                                        Continuar Comprando
                                    </Button>
                                </Link>

                                {/* Trust badges */}
                                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="text-xl">🚚</div>
                                        <span className="text-gray-600 dark:text-gray-400">Envío seguro</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="text-xl">✅</div>
                                        <span className="text-gray-600 dark:text-gray-400">Garantía 30 días</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="text-xl">💳</div>
                                        <span className="text-gray-600 dark:text-gray-400">Pago seguro con Cashea</span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
