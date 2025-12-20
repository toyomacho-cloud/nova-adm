'use client'

import { useState, useEffect } from 'react'
import { Search, ShoppingCart, User, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function StorePage() {
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [cartCount, setCartCount] = useState(0)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    useEffect(() => {
        fetchProducts()
        loadCartCount()
    }, [])

    const fetchProducts = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/store/products?limit=12')
            const data = await res.json()
            if (data.success) {
                setProducts(data.products)
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadCartCount = () => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]')
        setCartCount(cart.reduce((sum: number, item: any) => sum + item.quantity, 0))
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        window.location.href = `/store/buscar?q=${encodeURIComponent(searchQuery)}`
    }

    const formatCurrency = (value: number, currency: 'USD' | 'BS' = 'USD') =>
        currency === 'USD'
            ? `$${value.toFixed(2)}`
            : `Bs. ${value.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-md">
                <div className="container mx-auto px-4">
                    {/* Top bar */}
                    <div className="flex items-center justify-between py-4">
                        {/* Logo */}
                        <Link href="/store" className="flex items-center gap-2">
                            <ShoppingCart className="w-8 h-8 text-primary-500" />
                            <span className="text-2xl font-bold">NOVA Store</span>
                        </Link>

                        {/* Search */}
                        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8">
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Buscar productos..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4"
                                />
                            </div>
                        </form>

                        {/* Actions */}
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" className="hidden md:flex">
                                <User className="w-5 h-5 mr-2" />
                                Cuenta
                            </Button>

                            <Link href="/store/carrito">
                                <Button variant="ghost" size="sm" className="relative">
                                    <ShoppingCart className="w-5 h-5" />
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                            {cartCount}
                                        </span>
                                    )}
                                </Button>
                            </Link>

                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden"
                            >
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center gap-6 py-3 border-t border-gray-200 dark:border-gray-700">
                        <Link href="/store" className="font-medium hover:text-primary-500 transition">
                            Inicio
                        </Link>
                        <Link href="/store/productos" className="hover:text-primary-500 transition">
                            Todos los Productos
                        </Link>
                        <Link href="/store/productos?category=Aceites" className="hover:text-primary-500 transition">
                            Aceites
                        </Link>
                        <Link href="/store/productos?category=Filtros" className="hover:text-primary-500 transition">
                            Filtros
                        </Link>
                        <Link href="/store/productos?category=Frenos" className="hover:text-primary-500 transition">
                            Frenos
                        </Link>
                        <Link href="/store/ofertas" className="text-red-500 font-medium hover:text-red-600 transition">
                            Ofertas
                        </Link>
                    </nav>

                    {/* Mobile menu */}
                    {mobileMenuOpen && (
                        <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
                            <form onSubmit={handleSearch} className="mb-4">
                                <Input
                                    type="text"
                                    placeholder="Buscar..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </form>
                            <nav className="flex flex-col gap-3">
                                <Link href="/store" className="font-medium">Inicio</Link>
                                <Link href="/store/productos">Todos los Productos</Link>
                                <Link href="/store/productos?category=Aceites">Aceites</Link>
                                <Link href="/store/productos?category=Filtros">Filtros</Link>
                                <Link href="/store/productos?category=Frenos">Frenos</Link>
                                <Link href="/store/ofertas" className="text-red-500">Ofertas</Link>
                            </nav>
                        </div>
                    )}
                </div>
            </header>

            {/* Hero Banner */}
            <section className="bg-gradient-to-r from-primary-500 to-primary-700 text-white py-16">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Repuestos de Calidad
                    </h1>
                    <p className="text-xl mb-8">
                        Todo lo que necesitas para tu vehículo al mejor precio
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100">
                            Ver Catálogo
                        </Button>
                        <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                            Ofertas Especiales
                        </Button>
                    </div>
                </div>
            </section>

            {/* Trust Badges */}
            <section className="bg-white dark:bg-gray-800 py-8 border-y border-gray-200 dark:border-gray-700">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                        <div>
                            <div className="text-3xl mb-2">🚚</div>
                            <h3 className="font-bold mb-1">Envío Gratis</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">En compras mayores a $50</p>
                        </div>
                        <div>
                            <div className="text-3xl mb-2">✅</div>
                            <h3 className="font-bold mb-1">Garantía</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">30 días de garantía</p>
                        </div>
                        <div>
                            <div className="text-3xl mb-2">💳</div>
                            <h3 className="font-bold mb-1">Pago Seguro</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Cashea y transferencias</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Products Grid */}
            <section className="py-12">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-bold">Productos Destacados</h2>
                        <Link href="/store/productos">
                            <Button variant="outline">Ver Todos →</Button>
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 animate-pulse">
                                    <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded mb-4"></div>
                                    <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded mb-2"></div>
                                    <div className="bg-gray-200 dark:bg-gray-700 h-4 w-2/3 rounded"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {products.map((product) => (
                                <Link
                                    key={product.id}
                                    href={`/store/productos/${product.id}`}
                                    className="group"
                                >
                                    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow hover:shadow-xl transition-shadow">
                                        <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                                            {product.image ? (
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h h-full flex items-center justify-center">
                                                    <ShoppingCart className="w-16 h-16 text-gray-300" />
                                                </div>
                                            )}
                                            {product.stock <= product.minStock && (
                                                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                                                    Últimas unidades
                                                </span>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-semibold mb-1 line-clamp-2 group-hover:text-primary-500 transition">
                                                {product.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 mb-2">SKU: {product.sku}</p>
                                            <div className="flex items-baseline gap-2 mb-3">
                                                <span className="text-2xl font-bold text-primary-600">
                                                    {formatCurrency(product.priceUSD)}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {formatCurrency(product.priceBs, 'BS')}
                                                </span>
                                            </div>
                                            <Button className="w-full" size="sm">
                                                <ShoppingCart className="w-4 h-4 mr-2" />
                                                Agregar
                                            </Button>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <h3 className="font-bold text-lg mb-4">NOVA Store</h3>
                            <p className="text-gray-400 text-sm">
                                Tu tienda de confianza para repuestos automotrices
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">Categorías</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><Link href="/store/productos?category=Aceites">Aceites</Link></li>
                                <li><Link href="/store/productos?category=Filtros">Filtros</Link></li>
                                <li><Link href="/store/productos?category=Frenos">Frenos</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">Ayuda</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><Link href="/store/ayuda">Preguntas Frecuentes</Link></li>
                                <li><Link href="/store/envios">Envíos</Link></li>
                                <li><Link href="/store/devoluciones">Devoluciones</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">Contacto</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li>📧 ventas@novastore.com</li>
                                <li>📞 +58 412 123 4567</li>
                                <li>📍 Caracas, Venezuela</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
                        <p>&copy; 2025 NOVA Store. Todos los derechos reservados.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
