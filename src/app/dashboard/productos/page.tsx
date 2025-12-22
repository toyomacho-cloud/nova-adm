'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Search, Edit, Trash2, X, Package, TrendingDown, TrendingUp, Upload } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Product {
    id: string
    sku: string
    name: string
    description?: string
    category?: string
    priceUSD: number
    priceBS: number
    costUSD: number
    costBS: number
    stock: number
    minStock: number
    isActive: boolean
    createdAt: string
}

export default function ProductosPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)

    // Import state
    const [importing, setImporting] = useState(false)
    const [importResult, setImportResult] = useState<{
        success: boolean
        created?: number
        updated?: number
        errors?: string[]
    } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Form state
    const [formData, setFormData] = useState({
        sku: '',
        reference: '',
        description: '',
        category: '',
        costUSD: '',
        brand: '',
        location: '',
        stock: '0',
        minStock: '0',
    })
    const [generatingSku, setGeneratingSku] = useState(false)

    // Auto-generate SKU when brand and category change
    const generateSKU = async (brand: string, category: string) => {
        if (!brand || !category || brand.length < 2 || category.length < 2) return
        if (editingProduct) return // Don't regenerate for edits

        setGeneratingSku(true)
        try {
            const res = await fetch('/api/products/generate-sku', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ brand, category })
            })
            const data = await res.json()
            if (data.success) {
                setFormData(prev => ({ ...prev, sku: data.sku }))
            }
        } catch (error) {
            console.error('Error generating SKU:', error)
        } finally {
            setGeneratingSku(false)
        }
    }

    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchProducts = async (search = '') => {
        try {
            setLoading(true)
            const url = search
                ? `/api/products?search=${encodeURIComponent(search)}`
                : '/api/products'
            const res = await fetch(url)
            const data = await res.json()
            if (data.success) {
                setProducts(data.products)
            }
        } catch (error) {
            console.error('Error fetching products:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (value: string) => {
        setSearchTerm(value)
        if (value.length >= 2 || value.length === 0) {
            fetchProducts(value)
        }
    }

    const openCreateModal = () => {
        setEditingProduct(null)
        setFormData({
            sku: '',
            reference: '',
            description: '',
            category: '',
            costUSD: '',
            brand: '',
            location: '',
            stock: '0',
            minStock: '0',
        })
        setShowModal(true)
    }

    const openEditModal = (product: Product) => {
        setEditingProduct(product)
        setFormData({
            sku: product.sku,
            reference: (product as any).reference || '',
            description: product.description || '',
            category: product.category || '',
            costUSD: product.costUSD.toString(),
            brand: (product as any).brand || '',
            location: (product as any).location || '',
            stock: product.stock.toString(),
            minStock: product.minStock.toString(),
        })
        setShowModal(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const url = editingProduct
                ? `/api/products/${editingProduct.id}`
                : '/api/products'

            const method = editingProduct ? 'PATCH' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await res.json()

            if (data.success) {
                setShowModal(false)
                fetchProducts(searchTerm)
            } else {
                alert(data.error || 'Error al guardar producto')
            }
        } catch (error) {
            console.error('Error saving product:', error)
            alert('Error al guardar producto')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de desactivar este producto?')) return

        try {
            const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
            const data = await res.json()

            if (data.success) {
                fetchProducts(searchTerm)
            } else {
                alert(data.error || 'Error al eliminar producto')
            }
        } catch (error) {
            console.error('Error deleting product:', error)
            alert('Error al eliminar producto')
        }
    }

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setImporting(true)
        setImportResult(null)

        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/products/import', {
                method: 'POST',
                body: formData,
            })

            const data = await res.json()
            setImportResult(data)

            if (data.success) {
                fetchProducts(searchTerm)
            }
        } catch (error) {
            console.error('Error importing:', error)
            setImportResult({ success: false, errors: ['Error al importar'] })
        } finally {
            setImporting(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value)
    }

    return (
        <div className="p-6 space-y-6">
            {/* Hidden file input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".xlsx,.xls"
                className="hidden"
            />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Productos</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Gestiona tu catálogo de productos
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importing}
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        {importing ? 'Importando...' : 'Importar Excel'}
                    </Button>
                    <Button onClick={openCreateModal}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Producto
                    </Button>
                </div>
            </div>

            {/* Import Result */}
            {importResult && (
                <Card className={`p-4 ${importResult.success ? 'bg-green-50 dark:bg-green-900/20 border-green-200' : 'bg-red-50 dark:bg-red-900/20 border-red-200'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            {importResult.success ? (
                                <p className="text-green-800 dark:text-green-200">
                                    ✅ Importación completada: {importResult.created} creados, {importResult.updated} actualizados
                                    {importResult.errors && importResult.errors.length > 0 && (
                                        <span className="text-orange-600 ml-2">({importResult.errors.length} errores)</span>
                                    )}
                                </p>
                            ) : (
                                <p className="text-red-800 dark:text-red-200">
                                    ❌ Error: {importResult.errors?.join(', ')}
                                </p>
                            )}
                        </div>
                        <button onClick={() => setImportResult(null)} className="text-gray-500 hover:text-gray-700">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </Card>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Productos</p>
                            <p className="text-2xl font-bold">{products.length}</p>
                        </div>
                        <Package className="w-8 h-8 text-blue-500" />
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">En Stock</p>
                            <p className="text-2xl font-bold text-green-600">
                                {products.filter((p) => p.stock > p.minStock).length}
                            </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Stock Bajo</p>
                            <p className="text-2xl font-bold text-orange-600">
                                {products.filter((p) => p.stock <= p.minStock && p.stock > 0).length}
                            </p>
                        </div>
                        <TrendingDown className="w-8 h-8 text-orange-500" />
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Agotados</p>
                            <p className="text-2xl font-bold text-red-600">
                                {products.filter((p) => p.stock === 0).length}
                            </p>
                        </div>
                        <X className="w-8 h-8 text-red-500" />
                    </div>
                </Card>
            </div>

            {/* Search */}
            <Card className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        placeholder="Buscar por nombre, SKU o descripción..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </Card>

            {/* Products Grid */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    <p className="mt-2 text-gray-600">Cargando productos...</p>
                </div>
            ) : products.length === 0 ? (
                <Card className="p-12 text-center">
                    <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">No hay productos</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {searchTerm
                            ? 'No se encontraron productos con ese criterio'
                            : 'Comienza agregando tu primer producto'}
                    </p>
                    {!searchTerm && (
                        <Button onClick={openCreateModal}>
                            <Plus className="w-4 h-4 mr-2" />
                            Crear Primer Producto
                        </Button>
                    )}
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product) => {
                        const stockStatus =
                            product.stock === 0
                                ? 'out'
                                : product.stock <= product.minStock
                                    ? 'low'
                                    : 'ok'

                        return (
                            <Card
                                key={product.id}
                                className="p-6 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            SKU: {product.sku}
                                        </p>
                                    </div>
                                    <span
                                        className={`text-xs px-2 py-1 rounded ${stockStatus === 'ok'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                            : stockStatus === 'low'
                                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                            }`}
                                    >
                                        {product.stock} uni.
                                    </span>
                                </div>

                                {product.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                        {product.description}
                                    </p>
                                )}

                                {product.category && (
                                    <span className="inline-block text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded mb-3">
                                        {product.category}
                                    </span>
                                )}

                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            Precio:
                                        </span>
                                        <div className="text-right">
                                            <p className="font-bold text-green-600">
                                                ${formatCurrency(product.priceUSD)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Bs. {formatCurrency(product.priceBS)}
                                            </p>
                                        </div>
                                    </div>
                                    {product.costUSD > 0 && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">
                                                Costo:
                                            </span>
                                            <span className="text-gray-700 dark:text-gray-300">
                                                ${formatCurrency(product.costUSD)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openEditModal(product)}
                                        className="flex-1"
                                    >
                                        <Edit className="w-4 h-4 mr-1" />
                                        Editar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(product.id)}
                                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Modal Create/Edit */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">
                                    {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            SKU / Código {generatingSku && <span className="text-xs text-blue-500">(generando...)</span>}
                                        </label>
                                        <div className="flex gap-2">
                                            <Input
                                                required
                                                placeholder="Auto-generado con Marca + Categoría"
                                                value={formData.sku}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, sku: e.target.value })
                                                }
                                                className={generatingSku ? 'bg-gray-100 dark:bg-gray-700' : ''}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => generateSKU(formData.brand, formData.category)}
                                                disabled={generatingSku || !formData.brand || !formData.category}
                                                title="Generar SKU automáticamente basado en Marca y Categoría"
                                            >
                                                Generar
                                            </Button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Referencia *
                                        </label>
                                        <Input
                                            required
                                            placeholder="REF-001"
                                            value={formData.reference}
                                            onChange={(e) =>
                                                setFormData({ ...formData, reference: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-2">
                                            Descripción
                                        </label>
                                        <textarea
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
                                            rows={2}
                                            placeholder="Descripción del producto"
                                            value={formData.description}
                                            onChange={(e) =>
                                                setFormData({ ...formData, description: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Categoría *
                                        </label>
                                        <Input
                                            required
                                            placeholder="Repuestos, Lubricantes, etc."
                                            value={formData.category}
                                            onChange={(e) =>
                                                setFormData({ ...formData, category: e.target.value })
                                            }
                                            onBlur={() => generateSKU(formData.brand, formData.category)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Costo USD
                                        </label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            value={formData.costUSD}
                                            onChange={(e) =>
                                                setFormData({ ...formData, costUSD: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Marca *
                                        </label>
                                        <Input
                                            required
                                            placeholder="Toyota, Honda, Ford, etc."
                                            value={formData.brand}
                                            onChange={(e) =>
                                                setFormData({ ...formData, brand: e.target.value })
                                            }
                                            onBlur={() => generateSKU(formData.brand, formData.category)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Ubicación
                                        </label>
                                        <Input
                                            placeholder="Estante A1, Bodega 2, etc."
                                            value={formData.location}
                                            onChange={(e) =>
                                                setFormData({ ...formData, location: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Stock Actual
                                        </label>
                                        <Input
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            value={formData.stock}
                                            onChange={(e) =>
                                                setFormData({ ...formData, stock: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Stock Mínimo
                                        </label>
                                        <Input
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            value={formData.minStock}
                                            onChange={(e) =>
                                                setFormData({ ...formData, minStock: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button type="submit" className="flex-1">
                                        {editingProduct ? 'Actualizar' : 'Crear'} Producto
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}
