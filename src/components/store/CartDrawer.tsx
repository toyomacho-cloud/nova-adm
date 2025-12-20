'use client'

import { useState, useEffect } from 'react'
import { X, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

interface CartItem {
    id: string
    name: string
    sku: string
    priceUSD: number
    priceBs: number
    image?: string
    quantity: number
}

interface CartDrawerProps {
    isOpen: boolean
    onClose: () => void
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
    const [cart, setCart] = useState<CartItem[]>([])

    useEffect(() => {
        loadCart()

        // Listen for cart updates
        const handleCartUpdate = () => loadCart()
        window.addEventListener('cartUpdated', handleCartUpdate)

        return () => window.removeEventListener('cartUpdated', handleCartUpdate)
    }, [])

    const loadCart = () => {
        const cartData = JSON.parse(localStorage.getItem('cart') || '[]')
        setCart(cartData)
    }

    const updateQuantity = (id: string, delta: number) => {
        const updatedCart = cart.map((item) =>
            item.id === id
                ? { ...item, quantity: Math.max(1, item.quantity + delta) }
                : item
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

    const calculateTotals = () => {
        const subtotalUSD = cart.reduce((sum, item) => sum + item.priceUSD * item.quantity, 0)
        const subtotalBs = cart.reduce((sum, item) => sum + item.priceBs * item.quantity, 0)
        const taxUSD = subtotalUSD * 0.16
        const taxBs = subtotalBs * 0.16
        const totalUSD = subtotalUSD + taxUSD
        const totalBs = subtotalBs + taxBs

        return { subtotalUSD, subtotalBs, taxUSD, taxBs, totalUSD, totalBs }
    }

    const totals = calculateTotals()
    const formatCurrency = (value: number) => value.toFixed(2)

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="w-6 h-6" />
                        <h2 className="text-xl font-bold">
                            Carrito ({cart.reduce((sum, item) => sum + item.quantity, 0)})
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-4">
                    {cart.length === 0 ? (
                        <div className="text-center py-12">
                            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-500">Tu carrito está vacío</p>
                            <Button className="mt-4" onClick={onClose}>
                                Continuar comprando
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cart.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                >
                                    {/* Image */}
                                    <div className="w-20 h-20 bg-gray-200 dark:bg-gray-600 rounded flex-shrink-0">
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover rounded"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ShoppingCart className="w-8 h-8 text-gray-400" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                                            {item.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 mb-2">SKU: {item.sku}</p>
                                        <div className="text-sm font-bold text-primary-600">
                                            ${formatCurrency(item.priceUSD)}
                                        </div>

                                        {/* Quantity controls */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                onClick={() => updateQuantity(item.id, -1)}
                                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="font-medium w-8 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, 1)}
                                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="ml-auto p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {cart.length > 0 && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                                <span className="font-medium">${formatCurrency(totals.subtotalUSD)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">IVA (16%):</span>
                                <span className="font-medium">${formatCurrency(totals.taxUSD)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                                <span>Total:</span>
                                <div className="text-right">
                                    <div className="text-primary-600">${formatCurrency(totals.totalUSD)}</div>
                                    <div className="text-xs text-gray-500">
                                        Bs. {totals.totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Link href="/store/carrito" onClick={onClose}>
                            <Button className="w-full" size="lg">
                                Ver Carrito Completo
                            </Button>
                        </Link>
                        <Link href="/store/checkout" onClick={onClose}>
                            <Button variant="outline" className="w-full" size="lg">
                                Proceder al Pago
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </>
    )
}
