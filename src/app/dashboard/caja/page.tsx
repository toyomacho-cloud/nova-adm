'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Plus, X, TrendingUp, TrendingDown, Lock, ShoppingBag, CreditCard, Check, Search, FileText, Package } from 'lucide-react'
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

interface PendingDocument {
    id: string
    saleNumber: string
    documentType: 'QUOTE' | 'ORDER'
    totalUSD: number
    totalBS: number
    createdAt: string
    customer: {
        name: string
        rif: string
    }
    user: {
        name: string
    }
    items: {
        description: string
        quantity: number
        totalUSD: number
    }[]
}

interface PaymentMethod {
    id: string
    name: string
    currency: string
    type: string
    isActive: boolean
}

export default function CajaPage() {
    const [cashRegister, setCashRegister] = useState<CashRegister | null>(null)
    const [showOpenModal, setShowOpenModal] = useState(false)
    const [loading, setLoading] = useState(true)
    const [bcvRate, setBcvRate] = useState(0)

    // Tabs
    const [activeTab, setActiveTab] = useState<'quotes' | 'orders'>('orders')

    // Pending documents
    const [pendingQuotes, setPendingQuotes] = useState<PendingDocument[]>([])
    const [pendingOrders, setPendingOrders] = useState<PendingDocument[]>([])
    const [selectedDocument, setSelectedDocument] = useState<PendingDocument | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    // Payment
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [paymentSuccess, setPaymentSuccess] = useState<{ invoiceNumber: string, totalUSD: number } | null>(null)

    // Form states
    const [openingUSD, setOpeningUSD] = useState('')
    const [openingBS, setOpeningBS] = useState('')

    useEffect(() => {
        fetchCashRegister()
        fetchBCVRate()
        fetchPaymentMethods()
    }, [])

    useEffect(() => {
        if (cashRegister) {
            fetchPendingDocuments()
            const interval = setInterval(fetchPendingDocuments, 10000)
            return () => clearInterval(interval)
        }
    }, [cashRegister])

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

    const fetchPendingDocuments = async () => {
        try {
            // Fetch quotes
            const quotesRes = await fetch('/api/sales?paymentStatus=PENDING&documentType=QUOTE')
            const quotesData = await quotesRes.json()
            if (quotesData.success) {
                setPendingQuotes(quotesData.sales)
            }

            // Fetch orders
            const ordersRes = await fetch('/api/sales?paymentStatus=PENDING&documentType=ORDER')
            const ordersData = await ordersRes.json()
            if (ordersData.success) {
                setPendingOrders(ordersData.sales)
            }
        } catch (error) {
            console.error('Error fetching pending documents:', error)
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

    const handleProcessPayment = async () => {
        if (!selectedDocument || !selectedPaymentMethod) return

        setIsProcessing(true)
        try {
            const res = await fetch(`/api/sales/${selectedDocument.id}/pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentMethodId: selectedPaymentMethod.id
                })
            })

            const data = await res.json()

            if (data.success) {
                setPaymentSuccess({
                    invoiceNumber: data.invoiceNumber,
                    totalUSD: selectedDocument.totalUSD
                })
                fetchPendingDocuments()
                fetchCashRegister()
            } else {
                alert(`Error: ${data.error}`)
            }
        } catch (error) {
            console.error('Error processing payment:', error)
            alert('Error al procesar el pago')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleClosePaymentModal = () => {
        setSelectedDocument(null)
        setSelectedPaymentMethod(null)
        setPaymentSuccess(null)
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value)
    }

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('es-VE', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // Get current documents based on tab
    const currentDocuments = activeTab === 'quotes' ? pendingQuotes : pendingOrders

    // Filter documents by search
    const filteredDocuments = currentDocuments.filter(doc =>
        doc.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.customer.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

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
                        Gestión de caja y cobro de documentos
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Cash Balances */}
                    <div className="space-y-4">
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
                        <Card className="p-4">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Cajero:</span>
                                    <span className="font-medium">{cashRegister.user.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Apertura:</span>
                                    <span className="font-medium">{new Date(cashRegister.openedAt).toLocaleTimeString('es-VE')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Tasa BCV:</span>
                                    <span className="font-medium">Bs. {cashRegister.bcvRate.toFixed(2)} / USD</span>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column - Pending Documents */}
                    <div className="lg:col-span-2">
                        <Card className="h-full flex flex-col">
                            {/* Tabs */}
                            <div className="border-b border-gray-200 dark:border-gray-700">
                                <div className="flex">
                                    <button
                                        onClick={() => setActiveTab('orders')}
                                        className={`flex-1 px-4 py-3 text-center font-medium transition-all border-b-2 ${activeTab === 'orders'
                                                ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        <Package className="w-4 h-4 inline mr-2" />
                                        Pedidos
                                        {pendingOrders.length > 0 && (
                                            <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                {pendingOrders.length}
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('quotes')}
                                        className={`flex-1 px-4 py-3 text-center font-medium transition-all border-b-2 ${activeTab === 'quotes'
                                                ? 'border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        <FileText className="w-4 h-4 inline mr-2" />
                                        Presupuestos
                                        {pendingQuotes.length > 0 && (
                                            <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                {pendingQuotes.length}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        placeholder={`Buscar ${activeTab === 'quotes' ? 'presupuesto' : 'pedido'}...`}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {filteredDocuments.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                        {activeTab === 'quotes' ? (
                                            <>
                                                <FileText className="w-16 h-16 mb-2" />
                                                <p className="text-lg font-medium">No hay presupuestos pendientes</p>
                                            </>
                                        ) : (
                                            <>
                                                <ShoppingBag className="w-16 h-16 mb-2" />
                                                <p className="text-lg font-medium">No hay pedidos pendientes</p>
                                            </>
                                        )}
                                        <p className="text-sm">Los documentos del POS aparecerán aquí</p>
                                    </div>
                                ) : (
                                    filteredDocuments.map((doc) => (
                                        <div
                                            key={doc.id}
                                            onClick={() => setSelectedDocument(doc)}
                                            className={`p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${doc.documentType === 'QUOTE'
                                                    ? 'border-yellow-200 dark:border-yellow-800 hover:border-yellow-500'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-500'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        {doc.documentType === 'QUOTE' ? (
                                                            <span className="text-yellow-500">📋</span>
                                                        ) : (
                                                            <span className="text-blue-500">📦</span>
                                                        )}
                                                        <p className={`text-xl font-bold ${doc.documentType === 'QUOTE' ? 'text-yellow-600' : 'text-blue-600'
                                                            }`}>
                                                            {doc.saleNumber}
                                                        </p>
                                                    </div>
                                                    <p className="text-sm text-gray-500">
                                                        {formatTime(doc.createdAt)} • {doc.user.name}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-bold text-green-600">
                                                        ${formatCurrency(doc.totalUSD)}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Bs. {formatCurrency(doc.totalBS)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium">{doc.customer.name}</p>
                                                    <p className="text-xs text-gray-500">{doc.customer.rif}</p>
                                                </div>
                                                <Button size="sm" className={doc.documentType === 'QUOTE'
                                                    ? 'bg-yellow-500 hover:bg-yellow-600'
                                                    : ''
                                                }>
                                                    <CreditCard className="w-4 h-4 mr-1" />
                                                    {doc.documentType === 'QUOTE' ? 'Procesar' : 'Cobrar'}
                                                </Button>
                                            </div>

                                            {doc.documentType === 'QUOTE' && (
                                                <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                                                    ⚠️ Expira hoy a las 12:00 AM
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>
                    </div>
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
                                <div>
                                    <label className="block text-sm font-medium mb-2">💵 Efectivo en USD</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={openingUSD}
                                        onChange={(e) => setOpeningUSD(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">💰 Efectivo en Bs</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={openingBS}
                                        onChange={(e) => setOpeningBS(e.target.value)}
                                    />
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tasa BCV:</p>
                                    <p className="text-xl font-bold">Bs. {bcvRate.toFixed(2)} / USD</p>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <Button variant="outline" onClick={() => setShowOpenModal(false)} className="flex-1">
                                    Cancelar
                                </Button>
                                <Button onClick={handleOpenCashRegister} className="flex-1">
                                    Abrir Caja ✓
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Modal de Cobro */}
            {selectedDocument && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg">
                        <div className="p-6">
                            {paymentSuccess ? (
                                <div className="text-center py-4">
                                    <div className="w-20 h-20 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                        <Check className="w-10 h-10 text-green-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2">¡Pago Procesado!</h2>
                                    <p className="text-gray-500 mb-4">
                                        {selectedDocument.documentType === 'QUOTE'
                                            ? 'El presupuesto ha sido convertido a venta'
                                            : 'El pedido ha sido cobrado exitosamente'
                                        }
                                    </p>

                                    <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 mb-6">
                                        <p className="text-sm text-gray-500">Factura</p>
                                        <p className="text-2xl font-bold">{paymentSuccess.invoiceNumber}</p>
                                    </div>

                                    <Button onClick={handleClosePaymentModal} className="w-full">
                                        Continuar
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h2 className="text-2xl font-bold">
                                                {selectedDocument.documentType === 'QUOTE' ? 'Procesar Presupuesto' : 'Cobrar Pedido'}
                                            </h2>
                                            <p className={`font-medium ${selectedDocument.documentType === 'QUOTE' ? 'text-yellow-600' : 'text-blue-600'
                                                }`}>
                                                {selectedDocument.saleNumber}
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleClosePaymentModal}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-gray-500">Cliente:</span>
                                            <span className="font-medium">{selectedDocument.customer.name}</span>
                                        </div>
                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                                            {selectedDocument.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-sm py-1">
                                                    <span>{item.quantity}x {item.description}</span>
                                                    <span>${formatCurrency(item.totalUSD)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                                            <div className="flex justify-between text-lg font-bold">
                                                <span>TOTAL:</span>
                                                <span className="text-green-600">${formatCurrency(selectedDocument.totalUSD)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-gray-500">
                                                <span></span>
                                                <span>Bs. {formatCurrency(selectedDocument.totalBS)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                                            <DollarSign className="w-4 h-4" />
                                            Método de Pago
                                        </h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {paymentMethods.map((method) => (
                                                <button
                                                    key={method.id}
                                                    onClick={() => setSelectedPaymentMethod(method)}
                                                    className={`p-3 border-2 rounded-lg transition-all text-left ${selectedPaymentMethod?.id === method.id
                                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                                                        }`}
                                                >
                                                    <p className="font-medium">{method.name}</p>
                                                    <p className="text-xs text-gray-500">{method.currency}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={handleClosePaymentModal}
                                            className="flex-1"
                                            disabled={isProcessing}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            onClick={handleProcessPayment}
                                            disabled={!selectedPaymentMethod || isProcessing}
                                            className={`flex-1 ${selectedDocument.documentType === 'QUOTE'
                                                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                                    : 'bg-gradient-to-r from-green-600 to-emerald-600'
                                                }`}
                                        >
                                            {isProcessing ? (
                                                <span className="flex items-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    Procesando...
                                                </span>
                                            ) : (
                                                <span>💰 Cobrar ${formatCurrency(selectedDocument.totalUSD)}</span>
                                            )}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}
