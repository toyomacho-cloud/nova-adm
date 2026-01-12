'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
    ShoppingCart, Search, Plus, Minus, Trash2, User, FileText,
    CreditCard, Check, ChevronRight, ChevronLeft, Package, X, Maximize2
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Product {
    id: string
    sku: string
    name: string
    reference?: string
    location?: string
    brand?: string
    image?: string
    priceUSD: number
    costUSD: number
    stock: number
}

interface CartItem {
    product: Product
    quantity: number
    priceUSD: number
}

interface Customer {
    id: string
    name: string
    rif: string
    phone?: string
}

const PAYMENT_METHODS_BS = [
    { code: 'POS_BS', name: 'Punto de Venta', icon: '💳' },
    { code: 'PAGO_MOVIL', name: 'Pago Móvil', icon: '📱' },
    { code: 'TRANSFER_BS', name: 'Transferencia Bs', icon: '🏦' },
    { code: 'CASH_BS', name: 'Efectivo Bs', icon: '💵' },
]

const PAYMENT_METHODS_USD = [
    { code: 'CASH_USD', name: 'Efectivo USD', icon: '💲' },
    { code: 'CASH_EUR', name: 'Efectivo Euro', icon: '💶' },
    { code: 'ZELLE', name: 'Zelle', icon: '⚡' },
    { code: 'PAYPAL', name: 'PayPal', icon: '🅿️' },
    { code: 'USDT', name: 'USDT', icon: '₮' },
    { code: 'BANESCO_PANAMA', name: 'Banesco Panamá', icon: '🏧' },
]

const PAYMENT_METHODS_CREDIT = [
    { code: 'CREDIT_SALE', name: 'Venta a Crédito', icon: '📅' },
    { code: 'CASHEA', name: 'Cashea', icon: '💳' },
]

const STEPS = [
    { id: 1, title: 'Productos', icon: Package },
    { id: 2, title: 'Cliente', icon: User },
    { id: 3, title: 'Resumen', icon: FileText },
    { id: 4, title: 'Cobro', icon: CreditCard },
    { id: 5, title: 'Listo', icon: Check },
]

export default function PuntoDeVentaPage() {
    const { data: session } = useSession()

    // Step management
    const [currentStep, setCurrentStep] = useState(1)

    // Products
    const [products, setProducts] = useState<Product[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [loadingProducts, setLoadingProducts] = useState(true)

    // Cart
    const [cart, setCart] = useState<CartItem[]>([])

    // Customer
    const [customers, setCustomers] = useState<Customer[]>([])
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [customerSearch, setCustomerSearch] = useState('')

    // New Customer Form
    const [showNewCustomerModal, setShowNewCustomerModal] = useState(false)
    const [newCustomerType, setNewCustomerType] = useState<'V' | 'E' | 'J' | 'G'>('V')
    const [newCustomerName, setNewCustomerName] = useState('')
    const [newCustomerRif, setNewCustomerRif] = useState('')
    const [newCustomerPhone, setNewCustomerPhone] = useState('')
    const [newCustomerAddress, setNewCustomerAddress] = useState('San Felix, Edo. Bolivar')
    const [creatingCustomer, setCreatingCustomer] = useState(false)

    // Exchange rate
    const [rates, setRates] = useState<{ bcv: number, binance: number }>({ bcv: 50, binance: 50 })
    const [rateType, setRateType] = useState<'BCV' | 'BINANCE'>('BCV')
    const exchangeRate = rateType === 'BCV' ? rates.bcv : rates.binance

    // Payment
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
    const [creditDays, setCreditDays] = useState(15)
    const [paymentReference, setPaymentReference] = useState('')

    // Document
    const [documentType, setDocumentType] = useState<'QUOTE' | 'ORDER' | 'SALE'>('SALE')
    const [processing, setProcessing] = useState(false)
    const [completedSale, setCompletedSale] = useState<any>(null)

    // Expanded product for detail view
    const [expandedProduct, setExpandedProduct] = useState<Product | null>(null)

    // Fetch products
    useEffect(() => {
        fetchProducts()
        fetchCustomers()
        fetchRates()
    }, [])

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products')
            const data = await res.json()
            if (data.success) {
                setProducts(data.products)
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoadingProducts(false)
        }
    }

    const fetchCustomers = async () => {
        try {
            const res = await fetch('/api/customers')
            const data = await res.json()
            if (data.success) {
                setCustomers(data.customers)
            }
        } catch (error) {
            console.error('Error:', error)
        }
    }

    const fetchRates = async () => {
        try {
            const [bcvRes, binanceRes] = await Promise.all([
                fetch('/api/bcv/rate'),
                fetch('/api/rates/binance')
            ])
            const bcvData = await bcvRes.json()
            const binanceData = await binanceRes.json()

            setRates({
                bcv: bcvData.rate || 50,
                binance: binanceData.rate || 50
            })
        } catch (error) {
            console.error('Error fetching rates:', error)
        }
    }

    // Cart functions
    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id)
            if (existing) {
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }
            return [...prev, { product, quantity: 1, priceUSD: product.priceUSD }]
        })
    }

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) {
                const newQty = Math.max(1, item.quantity + delta)
                return { ...item, quantity: newQty }
            }
            return item
        }))
    }

    const updatePrice = (productId: string, newPrice: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) {
                return { ...item, priceUSD: newPrice }
            }
            return item
        }))
    }

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.product.id !== productId))
    }

    const clearCart = () => {
        setCart([])
        setSelectedCustomer(null)
        setCurrentStep(1)
        setSelectedPaymentMethod(null)
        setDocumentType('SALE')
        setCompletedSale(null)
    }

    // Calculations
    const subtotalUSD = cart.reduce((sum, item) => sum + (item.priceUSD * item.quantity), 0)
    const taxRate = 0.16
    const taxAmountUSD = subtotalUSD * taxRate
    const totalUSD = subtotalUSD + taxAmountUSD
    const totalBS = totalUSD * exchangeRate

    // Process sale
    const processSale = async () => {
        if (!selectedPaymentMethod) {
            alert('Selecciona un método de pago')
            return
        }

        setProcessing(true)
        try {
            const res = await fetch('/api/sales-flow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    documentType,
                    customerId: selectedCustomer?.id,
                    items: cart.map(item => ({
                        productId: item.product.id,
                        quantity: item.quantity,
                        unitPriceUSD: item.priceUSD
                    })),
                    paymentMethod: selectedPaymentMethod,
                    paymentReference,
                    creditDays: selectedPaymentMethod === 'CREDIT_SALE' ? creditDays : null,
                    bcvRate: exchangeRate,
                    subtotalUSD,
                    taxAmountUSD,
                    totalUSD,
                    subtotalBS: subtotalUSD * exchangeRate,
                    taxAmountBS: taxAmountUSD * exchangeRate,
                    totalBS
                })
            })

            const data = await res.json()
            if (data.success) {
                setCompletedSale(data.sale)
                setCurrentStep(5)
            } else {
                alert('Error: ' + (data.error || 'Error al procesar'))
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al procesar la venta')
        } finally {
            setProcessing(false)
        }
    }

    // Filter products
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.reference && p.reference.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    // Filter customers
    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.rif.toLowerCase().includes(customerSearch.toLowerCase())
    )

    const formatCurrency = (value: number) => value.toFixed(2)

    const canProceed = () => {
        switch (currentStep) {
            case 1: return cart.length > 0
            case 2: return true // Customer is optional
            case 3: return true
            case 4: return selectedPaymentMethod !== null
            default: return false
        }
    }

    const nextStep = () => {
        if (canProceed() && currentStep < 5) {
            setCurrentStep(currentStep + 1)
        }
    }

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header with Steps */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ShoppingCart className="w-6 h-6 text-primary-500" />
                        Punto de Venta
                    </h1>
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                        <button
                            onClick={() => setRateType('BCV')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${rateType === 'BCV'
                                ? 'bg-white dark:bg-gray-600 text-green-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            BCV: {formatCurrency(rates.bcv)}
                        </button>
                        <button
                            onClick={() => setRateType('BINANCE')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${rateType === 'BINANCE'
                                ? 'bg-white dark:bg-gray-600 text-yellow-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Paralelo: {formatCurrency(rates.binance)}
                        </button>
                    </div>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-2">
                    {STEPS.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                            <button
                                onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                                disabled={step.id > currentStep}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${currentStep === step.id
                                    ? 'bg-primary-500 text-white'
                                    : step.id < currentStep
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                        : 'bg-gray-100 text-gray-400 dark:bg-gray-700'
                                    }`}
                            >
                                <step.icon className="w-4 h-4" />
                                <span className="hidden sm:inline text-sm">{step.title}</span>
                            </button>
                            {index < STEPS.length - 1 && (
                                <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-4">
                {/* Step 1: Products */}
                {currentStep === 1 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Product List */}
                        <div className="lg:col-span-2">
                            <Card className="p-4">
                                <div className="relative mb-4">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <Input
                                        placeholder="Buscar por nombre, SKU o referencia..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                        autoFocus
                                    />
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto">
                                    {loadingProducts ? (
                                        <div className="col-span-full text-center py-8">
                                            <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
                                        </div>
                                    ) : filteredProducts.length === 0 ? (
                                        <div className="col-span-full text-center py-8 text-gray-500">
                                            No se encontraron productos
                                        </div>
                                    ) : (
                                        filteredProducts.map(product => (
                                            <div
                                                key={product.id}
                                                className={`rounded-xl overflow-hidden transition-all border-2 ${product.stock <= 0
                                                    ? 'bg-gray-100 border-gray-200 opacity-50'
                                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:shadow-lg'
                                                    }`}
                                            >
                                                {/* Product Image */}
                                                <div className="relative h-24 bg-gray-100 dark:bg-gray-700">
                                                    {product.image ? (
                                                        <img
                                                            src={product.image}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Package className="w-8 h-8 text-gray-400" />
                                                        </div>
                                                    )}
                                                    {/* Stock Badge */}
                                                    <span className={`absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded font-bold ${product.stock <= 0 ? 'bg-red-500 text-white' : product.stock <= 5 ? 'bg-yellow-500 text-black' : 'bg-blue-500 text-white'}`}>
                                                        {product.stock}
                                                    </span>
                                                    {/* Expand Button */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setExpandedProduct(product)
                                                        }}
                                                        className="absolute top-2 left-2 p-1.5 rounded-lg bg-white/80 hover:bg-white text-gray-700 transition-all"
                                                    >
                                                        <Maximize2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                {/* Product Info */}
                                                <button
                                                    onClick={() => addToCart(product)}
                                                    disabled={product.stock <= 0}
                                                    className="w-full p-3 text-left"
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs text-gray-500 truncate">{product.reference || product.sku}</span>
                                                    </div>
                                                    <p className="font-medium text-sm truncate mb-1">{product.name}</p>
                                                    {product.brand && (
                                                        <p className="text-xs text-purple-600 font-medium truncate mb-1">🏷️ {product.brand}</p>
                                                    )}
                                                    {product.location && (
                                                        <p className="text-xs text-orange-600 truncate mb-1">📍 {product.location}</p>
                                                    )}
                                                    <div className="flex items-center justify-between">
                                                        <p className="font-bold text-green-600 text-lg">${formatCurrency(product.priceUSD)}</p>
                                                        <span className="text-xs text-gray-500">Bs. {formatCurrency(product.priceUSD * exchangeRate)}</span>
                                                    </div>
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* Cart */}
                        <div>
                            <Card className="p-4 sticky top-4">
                                <h3 className="font-bold mb-3 flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5" />
                                    Carrito ({cart.length})
                                </h3>

                                {cart.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">Carrito vacío</p>
                                ) : (
                                    <>
                                        <div className="space-y-2 max-h-[40vh] overflow-y-auto mb-4">
                                            {cart.map(item => (
                                                <div key={item.product.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <p className="font-medium text-sm truncate flex-1">{item.product.name}</p>
                                                        <button
                                                            onClick={() => removeFromCart(item.product.id)}
                                                            className="p-1 rounded bg-red-100 text-red-600 hover:bg-red-200"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {/* Editable Price */}
                                                        <div className="flex-1">
                                                            <label className="text-xs text-gray-500">Precio:</label>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-xs">$</span>
                                                                <input
                                                                    type="number"
                                                                    value={item.priceUSD}
                                                                    onChange={(e) => updatePrice(item.product.id, parseFloat(e.target.value) || 0)}
                                                                    className="w-20 px-1 py-0.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                                                                    step="0.01"
                                                                    min="0"
                                                                />
                                                            </div>
                                                            <p className="text-xs text-blue-600">Bs. {formatCurrency(item.priceUSD * exchangeRate)}</p>
                                                        </div>
                                                        {/* Quantity */}
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => updateQuantity(item.product.id, -1)}
                                                                className="p-1 rounded bg-gray-200 hover:bg-gray-300"
                                                            >
                                                                <Minus className="w-3 h-3" />
                                                            </button>
                                                            <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                                                            <button
                                                                onClick={() => updateQuantity(item.product.id, 1)}
                                                                className="p-1 rounded bg-gray-200 hover:bg-gray-300"
                                                            >
                                                                <Plus className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                        {/* Total */}
                                                        <div className="text-right min-w-20">
                                                            <p className="font-bold text-sm text-green-600">${formatCurrency(item.priceUSD * item.quantity)}</p>
                                                            <p className="text-xs text-blue-600">Bs. {formatCurrency(item.priceUSD * item.quantity * exchangeRate)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="border-t pt-3 space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span>Subtotal:</span>
                                                <span>${formatCurrency(subtotalUSD)}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-500">
                                                <span>IVA (16%):</span>
                                                <span>${formatCurrency(taxAmountUSD)}</span>
                                            </div>
                                            <div className="flex justify-between font-bold text-lg">
                                                <span>Total:</span>
                                                <span className="text-green-600">${formatCurrency(totalUSD)}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-500">
                                                <span>Bs:</span>
                                                <span>{formatCurrency(totalBS)}</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </Card>
                        </div>
                    </div>
                )}

                {/* Expanded Product Modal */}
                {expandedProduct && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in">
                        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="relative">
                                {/* Close Button */}
                                <button
                                    onClick={() => setExpandedProduct(null)}
                                    className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white text-gray-700 z-10"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                {/* Large Image */}
                                <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative">
                                    {expandedProduct.image ? (
                                        <img
                                            src={expandedProduct.image}
                                            alt={expandedProduct.name}
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Package className="w-20 h-20 text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Product Details */}
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">{expandedProduct.sku}</p>
                                            <h2 className="text-2xl font-bold">{expandedProduct.name}</h2>
                                            {expandedProduct.reference && (
                                                <p className="text-gray-500">Ref: {expandedProduct.reference}</p>
                                            )}
                                        </div>
                                        <span className={`text-lg px-3 py-1 rounded-full font-bold ${expandedProduct.stock <= 0 ? 'bg-red-100 text-red-600' : expandedProduct.stock <= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-600'}`}>
                                            Stock: {expandedProduct.stock}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        {expandedProduct.brand && (
                                            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                                <p className="text-xs text-purple-600 font-medium">Marca</p>
                                                <p className="font-bold text-purple-700">{expandedProduct.brand}</p>
                                            </div>
                                        )}
                                        {expandedProduct.location && (
                                            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                                <p className="text-xs text-orange-600 font-medium">Ubicación</p>
                                                <p className="font-bold text-orange-700">{expandedProduct.location}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-xl mb-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-500">Precio USD</p>
                                                <p className="text-3xl font-bold text-green-600">${formatCurrency(expandedProduct.priceUSD)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500">Precio Bs ({rateType})</p>
                                                <p className="text-2xl font-bold text-blue-600">Bs. {formatCurrency(expandedProduct.priceUSD * exchangeRate)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => setExpandedProduct(null)}
                                            className="flex-1"
                                        >
                                            Cerrar
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                addToCart(expandedProduct)
                                                setExpandedProduct(null)
                                            }}
                                            disabled={expandedProduct.stock <= 0}
                                            className="flex-1 bg-green-600 hover:bg-green-700"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Agregar al Carrito
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Step 2: Customer */}
                {currentStep === 2 && (
                    <div className="max-w-2xl mx-auto">
                        <Card className="p-6">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Seleccionar Cliente (Opcional)
                            </h3>

                            {/* Search and New Customer Button */}
                            <div className="flex gap-2 mb-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <Input
                                        placeholder="Buscar por nombre o RIF..."
                                        value={customerSearch}
                                        onChange={(e) => setCustomerSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Button
                                    onClick={() => setShowNewCustomerModal(true)}
                                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Nuevo Cliente
                                </Button>
                            </div>

                            {selectedCustomer && (
                                <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-500">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-green-700 dark:text-green-300">{selectedCustomer.name}</p>
                                            <p className="text-sm text-gray-600">{selectedCustomer.rif}</p>
                                        </div>
                                        <button onClick={() => setSelectedCustomer(null)} className="text-red-500">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                                {filteredCustomers.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">No se encontraron clientes</p>
                                ) : (
                                    filteredCustomers.map(customer => (
                                        <button
                                            key={customer.id}
                                            onClick={() => setSelectedCustomer(customer)}
                                            className={`w-full p-3 text-left rounded-lg border-2 transition-all ${selectedCustomer?.id === customer.id
                                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-primary-500'
                                                }`}
                                        >
                                            <p className="font-medium">{customer.name}</p>
                                            <p className="text-sm text-gray-500">{customer.rif}</p>
                                        </button>
                                    ))
                                )}
                            </div>

                            <p className="mt-4 text-sm text-gray-500 text-center">
                                Puedes continuar sin seleccionar cliente para ventas rápidas
                            </p>
                        </Card>

                        {/* New Customer Modal */}
                        {showNewCustomerModal && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                <Card className="w-full max-w-md mx-4 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-lg">Nuevo Cliente</h3>
                                        <button
                                            onClick={() => setShowNewCustomerModal(false)}
                                            className="text-gray-500 hover:text-gray-700"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Customer Type */}
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Tipo de Cliente</label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {[
                                                    { value: 'V', label: 'Venezolano', desc: 'V-' },
                                                    { value: 'E', label: 'Extranjero', desc: 'E-' },
                                                    { value: 'J', label: 'Jurídico', desc: 'J-' },
                                                    { value: 'G', label: 'Gubernamental', desc: 'G-' },
                                                ].map(type => (
                                                    <button
                                                        key={type.value}
                                                        onClick={() => setNewCustomerType(type.value as 'V' | 'E' | 'J' | 'G')}
                                                        className={`p-2 rounded-lg border-2 text-center transition-all ${newCustomerType === type.value
                                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                                                            }`}
                                                    >
                                                        <p className="font-bold text-lg">{type.value}</p>
                                                        <p className="text-xs text-gray-500">{type.label}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Customer Name */}
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Nombre / Razón Social</label>
                                            <Input
                                                placeholder="Nombre del cliente"
                                                value={newCustomerName}
                                                onChange={(e) => setNewCustomerName(e.target.value)}
                                            />
                                        </div>

                                        {/* RIF/Cédula */}
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                {newCustomerType === 'J' || newCustomerType === 'G' ? 'RIF' : 'Cédula'}
                                            </label>
                                            <div className="flex">
                                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-100 text-gray-600 text-sm font-medium">
                                                    {newCustomerType}-
                                                </span>
                                                <Input
                                                    placeholder={newCustomerType === 'J' || newCustomerType === 'G' ? '12345678-9' : '12345678'}
                                                    value={newCustomerRif}
                                                    onChange={(e) => setNewCustomerRif(e.target.value.replace(/[^0-9-]/g, ''))}
                                                    className="rounded-l-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Phone */}
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Teléfono</label>
                                            <Input
                                                placeholder="0412-1234567"
                                                value={newCustomerPhone}
                                                onChange={(e) => setNewCustomerPhone(e.target.value)}
                                            />
                                        </div>

                                        {/* Address */}
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Dirección</label>
                                            <Input
                                                placeholder="Dirección del cliente"
                                                value={newCustomerAddress}
                                                onChange={(e) => setNewCustomerAddress(e.target.value)}
                                            />
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-3 pt-4">
                                            <Button
                                                variant="outline"
                                                onClick={() => setShowNewCustomerModal(false)}
                                                className="flex-1"
                                            >
                                                Cancelar
                                            </Button>
                                            <Button
                                                onClick={async () => {
                                                    if (!newCustomerName.trim() || !newCustomerRif.trim()) {
                                                        alert('Por favor complete el nombre y cédula/RIF del cliente')
                                                        return
                                                    }
                                                    setCreatingCustomer(true)
                                                    try {
                                                        const rif = `${newCustomerType}-${newCustomerRif}`
                                                        const res = await fetch('/api/customers', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                name: newCustomerName.trim(),
                                                                rif: rif,
                                                                phone: newCustomerPhone.trim() || null,
                                                                address: newCustomerAddress.trim() || null,
                                                            }),
                                                        })
                                                        if (!res.ok) {
                                                            const err = await res.json()
                                                            throw new Error(err.error || 'Error al crear cliente')
                                                        }
                                                        const newCustomer = await res.json()
                                                        // Add to customers list and select it
                                                        setCustomers(prev => [newCustomer, ...prev])
                                                        setSelectedCustomer(newCustomer)
                                                        // Reset form
                                                        setNewCustomerName('')
                                                        setNewCustomerRif('')
                                                        setNewCustomerPhone('')
                                                        setNewCustomerAddress('San Felix, Edo. Bolivar')
                                                        setNewCustomerType('V')
                                                        setShowNewCustomerModal(false)
                                                    } catch (error: any) {
                                                        alert(error.message || 'Error al crear cliente')
                                                    } finally {
                                                        setCreatingCustomer(false)
                                                    }
                                                }}
                                                disabled={creatingCustomer}
                                                className="flex-1 bg-green-600 hover:bg-green-700"
                                            >
                                                {creatingCustomer ? 'Creando...' : 'Guardar Cliente'}
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Summary */}
                {currentStep === 3 && (
                    <div className="max-w-2xl mx-auto">
                        <Card className="p-6">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Resumen del Documento
                            </h3>

                            {/* Document Type Selector */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2">Tipo de Documento:</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { type: 'QUOTE' as const, label: '📋 Presupuesto', color: 'yellow' },
                                        { type: 'ORDER' as const, label: '📦 Pedido', color: 'orange' },
                                        { type: 'SALE' as const, label: '🧾 Venta', color: 'green' },
                                    ].map(doc => (
                                        <button
                                            key={doc.type}
                                            onClick={() => setDocumentType(doc.type)}
                                            className={`p-3 rounded-xl border-2 text-center transition-all ${documentType === doc.type
                                                ? `border-${doc.color}-500 bg-${doc.color}-50 dark:bg-${doc.color}-900/20`
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                                                }`}
                                        >
                                            {doc.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl mb-4">
                                <p className="text-sm text-gray-500">Cliente:</p>
                                <p className="font-bold">
                                    {selectedCustomer ? selectedCustomer.name : 'Venta Rápida (Sin Cliente)'}
                                </p>
                            </div>

                            {/* Items */}
                            <div className="border rounded-xl overflow-hidden mb-4">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100 dark:bg-gray-800">
                                        <tr>
                                            <th className="text-left p-2">Producto</th>
                                            <th className="text-center p-2">Cant.</th>
                                            <th className="text-right p-2">Precio</th>
                                            <th className="text-right p-2">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cart.map(item => (
                                            <tr key={item.product.id} className="border-t">
                                                <td className="p-2">{item.product.name}</td>
                                                <td className="p-2 text-center">{item.quantity}</td>
                                                <td className="p-2 text-right">${formatCurrency(item.priceUSD)}</td>
                                                <td className="p-2 text-right font-medium">${formatCurrency(item.priceUSD * item.quantity)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals */}
                            <div className="p-4 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-800 dark:to-gray-900 rounded-xl">
                                <div className="flex justify-between mb-1">
                                    <span>Subtotal:</span>
                                    <span>${formatCurrency(subtotalUSD)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600 mb-1">
                                    <span>IVA (16%):</span>
                                    <span>${formatCurrency(taxAmountUSD)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-xl">
                                    <span>Total:</span>
                                    <span className="text-green-600">${formatCurrency(totalUSD)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>En Bs:</span>
                                    <span>Bs. {formatCurrency(totalBS)}</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Step 4: Payment */}
                {currentStep === 4 && (
                    <div className="max-w-3xl mx-auto">
                        <Card className="p-6">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <CreditCard className="w-5 h-5" />
                                Método de Pago
                            </h3>

                            <div className="text-center mb-6 p-4 bg-gradient-to-br from-green-100 to-blue-100 dark:from-gray-800 dark:to-gray-900 rounded-xl">
                                <p className="text-sm text-gray-600">Total a Cobrar</p>
                                <p className="text-4xl font-bold text-green-600">${formatCurrency(totalUSD)}</p>
                                <p className="text-lg text-gray-500">Bs. {formatCurrency(totalBS)}</p>
                            </div>

                            {/* Payment Methods */}
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-2">💵 Bolívares</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {PAYMENT_METHODS_BS.map(method => (
                                            <button
                                                key={method.code}
                                                onClick={() => setSelectedPaymentMethod(method.code)}
                                                className={`p-3 rounded-xl border-2 text-center transition-all ${selectedPaymentMethod === method.code
                                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                                                    }`}
                                            >
                                                <span className="text-2xl block mb-1">{method.icon}</span>
                                                <span className="text-xs">{method.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-2">💲 USD / EUR</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {PAYMENT_METHODS_USD.map(method => (
                                            <button
                                                key={method.code}
                                                onClick={() => setSelectedPaymentMethod(method.code)}
                                                className={`p-3 rounded-xl border-2 text-center transition-all ${selectedPaymentMethod === method.code
                                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                                                    }`}
                                            >
                                                <span className="text-2xl block mb-1">{method.icon}</span>
                                                <span className="text-xs">{method.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-2">🏦 Crédito / Financiamiento</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {PAYMENT_METHODS_CREDIT.map(method => (
                                            <button
                                                key={method.code}
                                                onClick={() => setSelectedPaymentMethod(method.code)}
                                                className={`p-3 rounded-xl border-2 text-center transition-all ${selectedPaymentMethod === method.code
                                                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                                                    }`}
                                            >
                                                <span className="text-2xl block mb-1">{method.icon}</span>
                                                <span className="text-xs">{method.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Credit Days Input */}
                                {selectedPaymentMethod === 'CREDIT_SALE' && (
                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                                        <label className="block text-sm font-medium mb-2">Días para el cobro:</label>
                                        <div className="flex items-center gap-2">
                                            {[15, 30, 45, 60].map(days => (
                                                <button
                                                    key={days}
                                                    onClick={() => setCreditDays(days)}
                                                    className={`px-4 py-2 rounded-lg font-bold ${creditDays === days
                                                        ? 'bg-amber-500 text-white'
                                                        : 'bg-white border border-gray-300 hover:border-amber-500'
                                                        }`}
                                                >
                                                    {days}
                                                </button>
                                            ))}
                                            <Input
                                                type="number"
                                                value={creditDays}
                                                onChange={(e) => setCreditDays(parseInt(e.target.value) || 15)}
                                                className="w-20"
                                                min="1"
                                            />
                                            <span className="text-gray-500">días</span>
                                        </div>
                                        <p className="mt-2 text-sm text-amber-700">
                                            Esto creará una Cuenta por Cobrar con vencimiento en {creditDays} días.
                                        </p>
                                    </div>
                                )}

                                {/* Reference Input */}
                                {selectedPaymentMethod && selectedPaymentMethod !== 'CASH_USD' && selectedPaymentMethod !== 'CASH_BS' && selectedPaymentMethod !== 'CASH_EUR' && selectedPaymentMethod !== 'CREDIT_SALE' && (
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Referencia de pago:</label>
                                        <Input
                                            placeholder="Número de referencia..."
                                            value={paymentReference}
                                            onChange={(e) => setPaymentReference(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                )}

                {/* Step 5: Complete */}
                {currentStep === 5 && completedSale && (
                    <div className="max-w-lg mx-auto text-center">
                        <Card className="p-8">
                            <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                                <Check className="w-10 h-10 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">¡Venta Completada!</h2>
                            <p className="text-gray-500 mb-6">Documento #{completedSale.saleNumber}</p>

                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl mb-6">
                                <p className="text-3xl font-bold text-green-600">${formatCurrency(completedSale.totalUSD)}</p>
                                <p className="text-gray-500">Bs. {formatCurrency(completedSale.totalBS)}</p>
                            </div>

                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => window.print()}>
                                    🖨️ Imprimir
                                </Button>
                                <Button className="flex-1" onClick={clearCart}>
                                    ➕ Nueva Venta
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}
            </div>

            {/* Navigation Footer */}
            {currentStep < 5 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
                    <div className="max-w-3xl mx-auto flex items-center justify-between">
                        <Button
                            variant="outline"
                            onClick={prevStep}
                            disabled={currentStep === 1}
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Anterior
                        </Button>

                        <div className="text-center">
                            <p className="text-sm text-gray-500">Total</p>
                            <p className="text-xl font-bold text-green-600">${formatCurrency(totalUSD)}</p>
                        </div>

                        {currentStep === 4 ? (
                            <Button
                                onClick={processSale}
                                disabled={!canProceed() || processing}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {processing ? 'Procesando...' : '✅ Confirmar Pago'}
                            </Button>
                        ) : (
                            <Button
                                onClick={nextStep}
                                disabled={!canProceed()}
                            >
                                Siguiente
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
