'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Minus, Trash2, ShoppingCart, User as UserIcon, DollarSign } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Product {
    id: string
    sku: string
    name: string
    priceUSD: number
    priceBS: number
    stock: number
}

interface CartItem {
    product: Product
    quantity: number
}

interface Customer {
    id: string
    name: string
    rif: string
}

interface PaymentMethod {
    id: string
    name: string
    currency: string
    type: string
    isActive: boolean
}

export default function POSPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [customers, setCustomers] = useState<Customer[]>([])
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])

    const [searchProduct, setSearchProduct] = useState('')
    const [searchCustomer, setSearchCustomer] = useState('')
    const [cart, setCart] = useState<CartItem[]>([])
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)
    const [bcvRate, setBcvRate] = useState(276.58)

    useEffect(() => {
        fetchBCVRate()
        fetchPaymentMethods()
    }, [])

    useEffect(() => {
        if (searchProduct.length >= 2) {
            fetchProducts(searchProduct)
        } else {
            setProducts([])
        }
    }, [searchProduct])

    useEffect(() => {
        if (searchCustomer.length >= 2) {
            fetchCustomers(searchCustomer)
        } else {
            setCustomers([])
        }
    }, [searchCustomer])

    const fetchBCVRate = async () => {
        try {
            const res = await fetch('/api/bcv/rate')
            const data = await res.json()
            if (data.rate) {
                setBcvRate(data.rate)
            }
        } catch (error) {
            console.error('Error fetching BCV rate:', error)
        }
    }

    const fetchProducts = async (search: string) => {
        try {
            const res = await fetch(`/api/products?search=${encodeURIComponent(search)}`)
            const data = await res.json()
            if (data.success) {
                setProducts(data.products.filter((p: Product) => p.stock > 0))
            }
        } catch (error) {
            console.error('Error fetching products:', error)
        }
    }

    const fetchCustomers = async (search: string) => {
        try {
            const res = await fetch(`/api/customers?search=${encodeURIComponent(search)}`)
            const data = await res.json()
            if (data.success) {
                setCustomers(data.customers)
            }
        } catch (error) {
            console.error('Error fetching customers:', error)
        }
    }

    const fetchPaymentMethods = async () => {
        try {
            const res = await fetch('/api/payment-methods')
            const data = await res.json()
            if (data.success) {
                setPaymentMethods(data.paymentMethods.filter((pm: PaymentMethod) => pm.isActive))
            }
        } catch (error) {
            console.error('Error fetching payment methods:', error)
        }
    }

    const addToCart = (product: Product) => {
        const existing = cart.find((item) => item.product.id === product.id)

        if (existing) {
            if (existing.quantity >= product.stock) {
                alert('Stock insuficiente')
                return
            }
            setCart(
                cart.map((item) =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            )
        } else {
            setCart([...cart, { product, quantity: 1 }])
        }

        setSearchProduct('')
        setProducts([])
    }

    const updateQuantity = (productId: string, delta: number) => {
        const item = cart.find((i) => i.product.id === productId)
        if (!item) return

        const newQuantity = item.quantity + delta

        if (newQuantity <= 0) {
            removeFromCart(productId)
            return
        }

        if (newQuantity > item.product.stock) {
            alert('Stock insuficiente')
            return
        }

        setCart(
            cart.map((i) =>
                i.product.id === productId ? { ...i, quantity: newQuantity } : i
            )
        )
    }

    const removeFromCart = (productId: string) => {
        setCart(cart.filter((item) => item.product.id !== productId))
    }

    const clearCart = () => {
        setCart([])
        setSelectedCustomer(null)
        setSelectedPaymentMethod(null)
    }

    // Calculations
    const subtotalUSD = cart.reduce(
        (sum, item) => sum + item.product.priceUSD * item.quantity,
        0
    )
    const subtotalBS = cart.reduce(
        (sum, item) => sum + item.product.priceBS * item.quantity,
        0
    )
    const taxRate = 0.16
    const taxUSD = subtotalUSD * taxRate
    const taxBS = subtotalBS * taxRate
    const totalUSD = subtotalUSD + taxUSD
    const totalBS = subtotalBS + taxBS

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value)
    }

    const handleCheckout = async () => {
        if (cart.length === 0) {
            alert('El carrito está vacío')
            return
        }

        if (!selectedCustomer) {
            alert('Selecciona un cliente')
            return
        }

        if (!selectedPaymentMethod) {
            alert('Selecciona un método de pago')
            return
        }

        try {
            const saleData = {
                customerId: selectedCustomer.id,
                paymentMethodId: selectedPaymentMethod.id,
                items: cart.map((item) => ({
                    productId: item.product.id,
                    quantity: item.quantity,
                })),
            }

            const res = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(saleData),
            })

            const data = await res.json()

            if (data.success) {
                alert(
                    `✅ Venta completada!\n\n` +
                    `Factura: ${data.sale.invoiceNumber}\n` +
                    `Total: $${formatCurrency(data.sale.totalUSD)}\n` +
                    `Bs. ${formatCurrency(data.sale.totalBS)}`
                )

                // Clear everything
                clearCart()

                // Refresh - in real app show invoice
            } else {
                alert(`❌ Error: ${data.error}`)
            }
        } catch (error) {
            console.error('Error creating sale:', error)
            alert('Error al procesar la venta')
        }
    }

    return (
        <div className="h-[calc(100vh-4rem)] flex gap-4 p-4">
            {/* Left Column - Products */}
            <div className="w-1/3 flex flex-col gap-4">
                <Card className="flex-1 flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-bold mb-3">Productos</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Buscar producto..."
                                value={searchProduct}
                                onChange={(e) => setSearchProduct(e.target.value)}
                                className="pl-9 text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {products.map((product) => (
                            <div
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer transition-colors"
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-medium text-sm">{product.name}</h3>
                                    <span className="text-xs text-gray-500">Stock: {product.stock}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500">{product.sku}</span>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-green-600">
                                            ${formatCurrency(product.priceUSD)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Bs. {formatCurrency(product.priceBS)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {searchProduct.length >= 2 && products.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <p className="text-sm">No se encontraron productos</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Center Column - Cart */}
            <div className="w-1/3 flex flex-col gap-4">
                <Card className="flex-1 flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5" />
                            <h2 className="text-lg font-bold">Carrito</h2>
                            <span className="text-sm text-gray-500">({cart.length})</span>
                        </div>
                        {cart.length > 0 && (
                            <Button variant="outline" size="sm" onClick={clearCart}>
                                Limpiar
                            </Button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <ShoppingCart className="w-16 h-16 mb-2" />
                                <p className="text-sm">Carrito vacío</p>
                                <p className="text-xs">Busca y agrega productos</p>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <div
                                    key={item.product.id}
                                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-medium text-sm flex-1">{item.product.name}</h3>
                                        <button
                                            onClick={() => removeFromCart(item.product.id)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => updateQuantity(item.product.id, -1)}
                                                className="w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="text-sm font-medium w-8 text-center">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item.product.id, 1)}
                                                className="w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-sm font-bold">
                                                ${formatCurrency(item.product.priceUSD * item.quantity)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Bs. {formatCurrency(item.product.priceBS * item.quantity)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Totals */}
                    {cart.length > 0 && (
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                                <div className="text-right">
                                    <p className="font-medium">${formatCurrency(subtotalUSD)}</p>
                                    <p className="text-xs text-gray-500">Bs. {formatCurrency(subtotalBS)}</p>
                                </div>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">IVA (16%):</span>
                                <div className="text-right">
                                    <p className="font-medium">${formatCurrency(taxUSD)}</p>
                                    <p className="text-xs text-gray-500">Bs. {formatCurrency(taxBS)}</p>
                                </div>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                                <span className="font-bold">TOTAL:</span>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-green-600">
                                        ${formatCurrency(totalUSD)}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Bs. {formatCurrency(totalBS)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Right Column - Customer & Payment */}
            <div className="w-1/3 flex flex-col gap-4">
                {/* Customer Selection */}
                <Card className="p-4">
                    <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                        <UserIcon className="w-5 h-5" />
                        Cliente
                    </h2>

                    {selectedCustomer ? (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-medium">{selectedCustomer.name}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {selectedCustomer.rif}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedCustomer(null)}
                                    className="text-red-500 hover:text-red-700 text-sm"
                                >
                                    Cambiar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <Input
                                placeholder="Buscar cliente..."
                                value={searchCustomer}
                                onChange={(e) => setSearchCustomer(e.target.value)}
                                className="mb-2"
                            />
                            <div className="max-h-40 overflow-y-auto space-y-1">
                                {customers.map((customer) => (
                                    <div
                                        key={customer.id}
                                        onClick={() => {
                                            setSelectedCustomer(customer)
                                            setSearchCustomer('')
                                            setCustomers([])
                                        }}
                                        className="p-2 border border-gray-200 dark:border-gray-700 rounded hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer text-sm"
                                    >
                                        <p className="font-medium">{customer.name}</p>
                                        <p className="text-xs text-gray-500">{customer.rif}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </Card>

                {/* Payment Method */}
                <Card className="p-4">
                    <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Método de Pago
                    </h2>

                    <div className="space-y-2">
                        {selectedPaymentMethod ? (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium">{selectedPaymentMethod.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {selectedPaymentMethod.currency}
                                        </p>
                                    </div>
                                    remove                  <button
                                        onClick={() => setSelectedPaymentMethod(null)}
                                        className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                        Cambiar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {paymentMethods.map((method) => (
                                    <button
                                        key={method.id}
                                        onClick={() => setSelectedPaymentMethod(method)}
                                        className="p-2 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors text-sm"
                                    >
                                        <p className="font-medium">{method.name}</p>
                                        <p className="text-xs text-gray-500">{method.currency}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>

                {/* Checkout Button */}
                <Button
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                    className="w-full py-6 text-lg font-bold"
                >
                    💰 COBRAR ${formatCurrency(totalUSD)}
                </Button>

                <p className="text-xs text-center text-gray-500">
                    Tasa BCV: Bs. {formatCurrency(bcvRate)} / USD
                </p>
            </div>
        </div>
    )
}
