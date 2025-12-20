'use client'

import { useState, useEffect } from 'react'
import { Plus, Package, Search } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ProveedoresPage() {
    const [vendors, setVendors] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        rif: '',
        address: '',
        phone: '',
        email: '',
    })

    useEffect(() => {
        fetchVendors()
    }, [search])

    const fetchVendors = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/vendors?search=${encodeURIComponent(search)}`)
            const data = await res.json()
            if (data.success) {
                setVendors(data.vendors)
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const res = await fetch('/api/vendors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await res.json()

            if (data.success) {
                alert('✅ Proveedor creado')
                fetchVendors()
                setShowModal(false)
                setFormData({ name: '', rif: '', address: '', phone: '', email: '' })
            } else {
                alert(`❌ Error: ${data.error}`)
            }
        } catch (error) {
            alert('Error al crear proveedor')
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Proveedores</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Gestión de proveedores para compras
                    </p>
                </div>
                <Button onClick={() => setShowModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Proveedor
                </Button>
            </div>

            <Card className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Buscar proveedor..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </Card>

            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
            ) : vendors.length === 0 ? (
                <Card className="p-12 text-center text-gray-500">
                    <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p>No hay proveedores registrados</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vendors.map((vendor) => (
                        <Card key={vendor.id} className="p-6 hover:shadow-lg transition-shadow">
                            <h3 className="font-bold text-lg mb-2">{vendor.name}</h3>
                            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                <p>RIF: {vendor.rif}</p>
                                {vendor.phone && <p>Tel: {vendor.phone}</p>}
                                {vendor.email && <p>Email: {vendor.email}</p>}
                                {vendor.address && <p className="text-xs mt-2">{vendor.address}</p>}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">Nuevo Proveedor</h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-500">
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Nombre *</label>
                                    <Input
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">RIF *</label>
                                    <Input
                                        required
                                        value={formData.rif}
                                        onChange={(e) => setFormData({ ...formData, rif: e.target.value })}
                                        placeholder="J-12345678-9"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Teléfono</label>
                                    <Input
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Email</label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Dirección</label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                        rows={3}
                                    />
                                </div>

                                <Button type="submit" className="w-full">
                                    Crear Proveedor
                                </Button>
                            </form>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}
