'use client'

import { useState, useEffect } from 'react'
import { Plus, Package, ShoppingBag } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ComprasPage() {
    const [purchases, setPurchases] = useState<any[]>([])
    const [vendors, setVendors] = useState<any[]>([])
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)

    const [formData, setFormData] = useState({
        vendorId: '',
        invoiceNumber: '',
        notes: '',
    })

    const [items, setItems] = useState([
        { description: '', quantity: 1, unitPrice: 0, productId: '' },
    ])

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [purchasesRes, vendorsRes, productsRes] = await Promise.all([
                fetch('/api/purchases'),
                fetch('/api/vendors'),
                fetch('/api/products'),
            ])

            const purchasesData = await purchasesRes.json()
            const vendorsData = await vendorsRes.json()
            const productsData = await productsRes.json()

            if (purchasesData.success) setPurchases(purchasesData.purchases)
            if (vendorsData.success) setVendors(vendorsData.vendors)
            if (productsData.success) setProducts(productsData.products)
        } catch (error
        ) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const res = await fetch('/api/purchases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    items: items.filter((i) => i.description && i.quantity > 0),
                }),
            })

            const data = await res.json()

            if (data.success) {
                alert(`✅ Compra registrada: ${data.purchase.invoiceNumber}`)
                fetchData()
                setShowModal(false)
                setFormData({ vendorId: '', invoiceNumber: '', notes: '' })
                setItems([{ description: '', quantity: 1, unitPrice: 0, productId: '' }])
            } else {
                alert(`❌ Error: ${data.error}`)
            }
        } catch (error) {
            alert('Error al registrar compra')
        }
    }

    const addItem = () => {
        setItems([...items, { description: '', quantity: 1, unitPrice: 0, productId: '' }])
    }

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index))
    }

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [field]: value }
        setItems(newItems)
    }

    const calculateSubtotal = () => {
        return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    }

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(value)

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('es-VE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Compras</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Registro de compras y gestión de inventario
                    </p>
                </div>
                <Button onClick={() => setShowModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Compra
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Total Compras
                        </h3>
                        <ShoppingBag className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-3xl font-bold">{purchases.length}</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Proveedores
                        </h3>
                        <Package className="w-5 h-5 text-purple-500" />
                    </div>
                    <p className="text-3xl font-bold">{vendors.length}</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Total
                        </h3>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                        ${formatCurrency(purchases.reduce((sum, p) => sum + p.total, 0))}
                    </p>
                </Card>
            </div>

            <Card>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-bold">Historial de Compras</h2>
                </div>
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    </div>
                ) : purchases.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <p>No hay compras registradas</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Factura
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Proveedor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Fecha
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Items
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Total
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                        Estado
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {purchases.map((purchase) => (
                                    <tr key={purchase.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {purchase.invoiceNumber}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium">{purchase.vendor.name}</p>
                                            <p className="text-xs text-gray-500">{purchase.vendor.rif}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {formatDate(purchase.invoiceDate)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            {purchase.items.length}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold">
                                            ${formatCurrency(purchase.total)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded">
                                                {purchase.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">Registrar Compra</h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-500">
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Proveedor *</label>
                                        <select
                                            required
                                            value={formData.vendorId}
                                            onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                        >
                                            <option value="">Seleccionar...</option>
                                            {vendors.map((v) => (
                                                <option key={v.id} value={v.id}>
                                                    {v.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Nro. Factura *</label>
                                        <Input
                                            required
                                            value={formData.invoiceNumber}
                                            onChange={(e) =>
                                                setFormData({ ...formData, invoiceNumber: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-medium">Items</label>
                                        <Button type="button" size="sm" onClick={addItem}>
                                            <Plus className="w-4 h-4 mr-1" />
                                            Agregar Item
                                        </Button>
                                    </div>

                                    {items.map((item, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                                            <div className="col-span-5">
                                                <Input
                                                    placeholder="Descripción"
                                                    value={item.description}
                                                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <Input
                                                    type="number"
                                                    placeholder="Cant."
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="Precio"
                                                    value={item.unitPrice}
                                                    onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value))}
                                                />
                                            </div>
                                            <div className="col-span-2 flex items-center justify-between">
                                                <span className="text-sm font-medium">
                                                    ${formatCurrency(item.quantity * item.unitPrice)}
                                                </span>
                                                {items.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        className="text-red-500"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    <div className="flex justify-between mb-2">
                                        <span>Subtotal:</span>
                                        <span className="font-bold">${formatCurrency(calculateSubtotal())}</span>
                                    </div>
                                    <div className="flex justify-between mb-2">
                                        <span>IVA (16%):</span>
                                        <span className="font-bold">
                                            ${formatCurrency(calculateSubtotal() * 0.16)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <span className="font-bold">TOTAL:</span>
                                        <span className="text-xl font-bold text-green-600">
                                            ${formatCurrency(calculateSubtotal() * 1.16)}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Notas</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                        rows={2}
                                    />
                                </div>

                                <Button type="submit" className="w-full">
                                    Registrar Compra
                                </Button>
                            </form>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}
