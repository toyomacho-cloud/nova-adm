'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, ShoppingCart, CreditCard, Truck, User } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

interface CartItem {
    id: string
    name: string
    priceUSD: number
    quantity: number
}

export default function CheckoutPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        // Step 1: Customer info
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerRif: '',

        // Step 2: Shipping
        shippingAddress: '',
        shippingCity: '',
        shippingState: '',
        shippingZip: '',

        // Step 3: Payment
        paymentMethod: 'cashea',
        notes: '',
    })

    const [cart, setCart] = useState<CartItem[]>([])

    // Load cart from localStorage on client-side only
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const cartData = JSON.parse(localStorage.getItem('cart') || '[]')
            setCart(cartData)
        }
    }, [])

    const calculateTotals = () => {
        const subtotal = cart.reduce((sum, item) => sum + item.priceUSD * item.quantity, 0)
        const shipping = subtotal >= 50 ? 0 : 5
        const tax = (subtotal + shipping) * 0.16
        const total = subtotal + shipping + tax
        return { subtotal, shipping, tax, total }
    }

    const totals = calculateTotals()

    const handleInputChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value })
    }

    const handleSubmit = async () => {
        setLoading(true)

        try {
            const res = await fetch('/api/store/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    items: cart,
                }),
            })

            const data = await res.json()

            if (data.success) {
                // Clear cart
                localStorage.removeItem('cart')
                window.dispatchEvent(new Event('cartUpdated'))

                // If Cashea payment, redirect to payment
                if (data.casheaPayment?.paymentUrl) {
                    window.location.href = data.casheaPayment.paymentUrl
                } else {
                    router.push(`/store/orden/${data.order.id}`)
                }
            } else {
                alert(`Error: ${data.error}`)
            }
        } catch (error) {
            alert('Error procesando el pedido')
        } finally {
            setLoading(false)
        }
    }

    const nextStep = () => {
        if (step < 3) setStep(step + 1)
    }

    const prevStep = () => {
        if (step > 1) setStep(step - 1)
    }

    const canProceed = () => {
        switch (step) {
            case 1:
                return formData.customerName && formData.customerEmail && formData.customerPhone
            case 2:
                return formData.shippingAddress && formData.shippingCity && formData.shippingState
            case 3:
                return true
            default:
                return false
        }
    }

    if (cart.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Card className="p-12 text-center">
                    <ShoppingCart className="w-24 h-24 mx-auto mb-6 text-gray-300" />
                    <h1 className="text-2xl font-bold mb-4">Tu carrito está vacío</h1>
                    <Button onClick={() => router.push('/store')}>
                        Ir a la tienda
                    </Button>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow">
                <div className="container mx-auto px-4 py-4">
                    <Link href="/store/carrito" className="flex items-center gap-2 text-primary-500">
                        <ArrowLeft className="w-5 h-5" />
                        Volver al carrito
                    </Link>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form */}
                    <div className="lg:col-span-2">
                        {/* Progress Steps */}
                        <div className="flex items-center justify-between mb-8">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className="flex items-center flex-1">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${s <= step
                                            ? 'bg-primary-500 text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                                            }`}
                                    >
                                        {s === 1 && <User className="w-5 h-5" />}
                                        {s === 2 && <Truck className="w-5 h-5" />}
                                        {s === 3 && <CreditCard className="w-5 h-5" />}
                                    </div>
                                    {s < 3 && (
                                        <div
                                            className={`flex-1 h-1 mx-2 ${s < step ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'
                                                }`}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        <Card className="p-6">
                            {/* Step 1: Customer Info */}
                            {step === 1 && (
                                <div className="space-y-4">
                                    <h2 className="text-2xl font-bold mb-4">Información Personal</h2>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Nombre Completo *</label>
                                        <Input
                                            required
                                            value={formData.customerName}
                                            onChange={(e) => handleInputChange('customerName', e.target.value)}
                                            placeholder="Juan Pérez"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Email *</label>
                                            <Input
                                                required
                                                type="email"
                                                value={formData.customerEmail}
                                                onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                                                placeholder="correo@ejemplo.com"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Teléfono *</label>
                                            <Input
                                                required
                                                type="tel"
                                                value={formData.customerPhone}
                                                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                                                placeholder="+58 412 1234567"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">RIF/CI (Opcional)</label>
                                        <Input
                                            value={formData.customerRif}
                                            onChange={(e) => handleInputChange('customerRif', e.target.value)}
                                            placeholder="V-12345678"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Shipping */}
                            {step === 2 && (
                                <div className="space-y-4">
                                    <h2 className="text-2xl font-bold mb-4">Información de Envío</h2>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Dirección *</label>
                                        <textarea
                                            required
                                            value={formData.shippingAddress}
                                            onChange={(e) => handleInputChange('shippingAddress', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                            rows={3}
                                            placeholder="Avenida Principal, Edificio Torre, Piso 5, Apto 5-A"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Ciudad *</label>
                                            <Input
                                                required
                                                value={formData.shippingCity}
                                                onChange={(e) => handleInputChange('shippingCity', e.target.value)}
                                                placeholder="Caracas"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Estado *</label>
                                            <select
                                                required
                                                value={formData.shippingState}
                                                onChange={(e) => handleInputChange('shippingState', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                            >
                                                <option value="">Seleccionar...</option>
                                                <option value="Distrito Capital">Distrito Capital</option>
                                                <option value="Miranda">Miranda</option>
                                                <option value="Carabobo">Carabobo</option>
                                                <option value="Zulia">Zulia</option>
                                                <option value="Aragua">Aragua</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Código Postal</label>
                                        <Input
                                            value={formData.shippingZip}
                                            onChange={(e) => handleInputChange('shippingZip', e.target.value)}
                                            placeholder="1050"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Payment */}
                            {step === 3 && (
                                <div className="space-y-4">
                                    <h2 className="text-2xl font-bold mb-4">Método de Pago</h2>

                                    <div className="space-y-3">
                                        {/* Cashea */}
                                        <label className="flex items-center gap-3 p-4 border-2 border-primary-500 bg-primary-50 dark:bg-primary-900/20 rounded-lg cursor-pointer">
                                            <input
                                                type="radio"
                                                name="payment"
                                                value="cashea"
                                                checked={formData.paymentMethod === 'cashea'}
                                                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                                                className="w-4 h-4"
                                            />
                                            <div className="flex-1">
                                                <div className="font-bold">Cashea</div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    Pago móvil, transferencia, tarjetas
                                                </div>
                                            </div>
                                            <CreditCard className="w-8 h-8 text-primary-500" />
                                        </label>

                                        {/* PayPal */}
                                        <label className="flex items-center gap-3 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500">
                                            <input
                                                type="radio"
                                                name="payment"
                                                value="paypal"
                                                checked={formData.paymentMethod === 'paypal'}
                                                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                                                className="w-4 h-4"
                                            />
                                            <div className="flex-1">
                                                <div className="font-bold">PayPal</div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    Pago internacional seguro (USD)
                                                </div>
                                            </div>
                                            <div className="text-2xl">💳</div>
                                        </label>

                                        {/* Pago Móvil */}
                                        <label className="flex items-center gap-3 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-green-500">
                                            <input
                                                type="radio"
                                                name="payment"
                                                value="pago_movil"
                                                checked={formData.paymentMethod === 'pago_movil'}
                                                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                                                className="w-4 h-4"
                                            />
                                            <div className="flex-1">
                                                <div className="font-bold">Pago Móvil</div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    Transferencia desde tu banco (Bs.)
                                                </div>
                                            </div>
                                            <div className="text-2xl">📱</div>
                                        </label>

                                        {/* Transferencia Manual */}
                                        <label className="flex items-center gap-3 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer opacity-50">
                                            <input
                                                type="radio"
                                                name="payment"
                                                value="transfer"
                                                disabled
                                                className="w-4 h-4"
                                            />
                                            <div className="flex-1">
                                                <div className="font-bold">Transferencia Bancaria</div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    Próximamente
                                                </div>
                                            </div>
                                            <div className="text-2xl">🏦</div>
                                        </label>
                                    </div>

                                    {/* Show Pago Móvil form if selected */}
                                    {formData.paymentMethod === 'pago_movil' && (
                                        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                            <h3 className="font-bold mb-3">Datos para Pago Móvil</h3>
                                            <div className="space-y-2 text-sm">
                                                <p><strong>Banco:</strong> Banco de Venezuela</p>
                                                <p><strong>Teléfono:</strong> 0424-1234567</p>
                                                <p><strong>RIF:</strong> J-12345678-9</p>
                                                <p><strong>Monto:</strong> Bs. {(totals.total * 36.5).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                                                * Realizarás el pago después de confirmar la orden
                                            </p>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Notas (Opcional)</label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => handleInputChange('notes', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                            rows={3}
                                            placeholder="Instrucciones especiales para la entrega..."
                                        />
                                    </div>
                                </div>
                            )}
                            {/* Navigation */}
                            <div className="flex justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <Button
                                    variant="outline"
                                    onClick={prevStep}
                                    disabled={step === 1}
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Atrás
                                </Button>

                                {step < 3 ? (
                                    <Button
                                        onClick={nextStep}
                                        disabled={!canProceed()}
                                    >
                                        Continuar
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={loading || !canProceed()}
                                        size="lg"
                                    >
                                        {loading ? 'Procesando...' : `Pagar $${totals.total.toFixed(2)}`}
                                    </Button>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <Card className="p-6 sticky top-4">
                            <h2 className="text-xl font-bold mb-4">Resumen del Pedido</h2>

                            <div className="space-y-3 mb-4">
                                {cart.map((item) => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <span className="flex-1">
                                            {item.name} x {item.quantity}
                                        </span>
                                        <span className="font-medium">
                                            ${(item.priceUSD * item.quantity).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Subtotal:</span>
                                    <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Envío:</span>
                                    <span className="font-medium">
                                        {totals.shipping === 0 ? (
                                            <span className="text-green-600">GRATIS</span>
                                        ) : (
                                            `$${totals.shipping.toFixed(2)}`
                                        )}
                                    </span>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">IVA (16%):</span>
                                    <span className="font-medium">${totals.tax.toFixed(2)}</span>
                                </div>

                                <div className="flex justify-between text-xl font-bold pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <span>Total:</span>
                                    <span className="text-primary-600">${totals.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
