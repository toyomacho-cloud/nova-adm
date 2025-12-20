'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ShoppingCart, Heart, Share2, Star, Truck, Shield, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function ProductDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [product, setProduct] = useState<any>(null)
    const [relatedProducts, setRelatedProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [quantity, setQuantity] = useState(1)
    const [selectedImage, setSelectedImage] = useState(0)

    useEffect(() => {
        if (params.slug) {
            fetchProduct()
        }
    }, [params.slug])

    const fetchProduct = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/store/products/${params.slug}`)
            const data = await res.json()

            if (data.success) {
                setProduct(data.product)
                setRelatedProducts(data.relatedProducts || [])
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const addToCart = () => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]')

        const existingIndex = cart.findIndex((item: any) => item.id === product.id)

        if (existingIndex >= 0) {
            cart[existingIndex].quantity += quantity
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                sku: product.sku,
                priceUSD: product.priceUSD,
                priceBs: product.priceBs,
                image: product.image,
                quantity,
            })
        }

        localStorage.setItem('cart', JSON.stringify(cart))
        alert(`✅ ${quantity} unidad(es) agregadas al carrito`)
        window.dispatchEvent(new Event('cartUpdated'))
    }

    const formatCurrency = (value: number, currency: 'USD' | 'BS' = 'USD') =>
        currency === 'USD'
            ? `$${value.toFixed(2)}`
            : `Bs. ${value.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        )
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Producto no encontrado</h1>
                    <Button onClick={() => router.push('/store')}>Volver a la tienda</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Simple Header */}
            <header className="bg-white dark:bg-gray-800 shadow">
                <div className="container mx-auto px-4 py-4">
                    <Link href="/store" className="flex items-center gap-2 text-primary-500 hover:text-primary-600">
                        <ArrowLeft className="w-5 h-5" />
                        Volver a la tienda
                    </Link>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* Images */}
                    <div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 mb-4">
                            <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                                {product.image ? (
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ShoppingCart className="w-32 h-32 text-gray-300" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Product Info */}
                    <div>
                        <div className="mb-4">
                            <p className="text-sm text-gray-500 mb-2">SKU: {product.sku}</p>
                            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

                            {/* Rating */}
                            <div className="flex items-center gap-2 mb-4">
                                <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                    ))}
                                </div>
                                <span className="text-sm text-gray-600">(45 reseñas)</span>
                            </div>

                            {/* Price */}
                            <div className="mb-6">
                                <div className="flex items-baseline gap-3 mb-2">
                                    <span className="text-4xl font-bold text-primary-600">
                                        {formatCurrency(product.priceUSD)}
                                    </span>
                                    <span className="text-xl text-gray-600">USD</span>
                                </div>
                                <p className="text-gray-600">
                                    {formatCurrency(product.priceBs, 'BS')}
                                </p>
                            </div>

                            {/* Stock */}
                            <div className="mb-6">
                                {product.stock > 0 ? (
                                    <div className="flex items-center gap-2 text-green-600">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <span className="font-medium">En stock ({product.stock} disponibles)</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-red-600">
                                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                        <span className="font-medium">Agotado</span>
                                    </div>
                                )}
                            </div>

                            {/* Quantity */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2">Cantidad</label>
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    >
                                        -
                                    </Button>
                                    <span className="text-xl font-bold w-12 text-center">{quantity}</span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                        disabled={quantity >= product.stock}
                                    >
                                        +
                                    </Button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3 mb-6">
                                <Button
                                    size="lg"
                                    className="w-full"
                                    onClick={addToCart}
                                    disabled={product.stock === 0}
                                >
                                    <ShoppingCart className="w-5 h-5 mr-2" />
                                    Agregar al Carrito
                                </Button>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="lg" className="flex-1">
                                        <Heart className="w-5 h-5 mr-2" />
                                        Favoritos
                                    </Button>
                                    <Button variant="outline" size="lg" className="flex-1">
                                        <Share2 className="w-5 h-5 mr-2" />
                                        Compartir
                                    </Button>
                                </div>
                            </div>

                            {/* Features */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <Truck className="w-5 h-5 text-primary-500" />
                                    <span>Envío gratis  +$50</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Shield className="w-5 h-5 text-primary-500" />
                                    <span>Garantía 30 días</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <Card className="p-6 mb-8">
                    <h2 className="text-2xl font-bold mb-4">Descripción</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        {product.description || 'Producto de alta calidad para tu vehículo.'}
                    </p>
                </Card>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Productos Relacionados</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {relatedProducts.map((related) => (
                                <Link key={related.id} href={`/store/productos/${related.id}`}>
                                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                                        <div className="aspect-square bg-gray-100 dark:bg-gray-700">
                                            {related.image ? (
                                                <img src={related.image} alt={related.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ShoppingCart className="w-12 h-12 text-gray-300" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-semibold mb-2 line-clamp-2">{related.name}</h3>
                                            <p className="text-xl font-bold text-primary-600">
                                                {formatCurrency(related.priceUSD)}
                                            </p>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
