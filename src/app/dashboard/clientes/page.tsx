'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, X, User } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Customer {
    id: string
    name: string
    rif: string
    phone?: string
    email?: string
    address?: string
    isSpecialTaxpayer: boolean
    balance: number
    createdAt: string
}

export default function ClientesPage() {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        rif: '',
        phone: '',
        email: '',
        address: '',
        isSpecialTaxpayer: false,
    })

    useEffect(() => {
        fetchCustomers()
    }, [])

    const fetchCustomers = async (search = '') => {
        try {
            setLoading(true)
            const url = search
                ? `/api/customers?search=${encodeURIComponent(search)}`
                : '/api/customers'
            const res = await fetch(url)
            const data = await res.json()
            if (data.success) {
                setCustomers(data.customers)
            }
        } catch (error) {
            console.error('Error fetching customers:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (value: string) => {
        setSearchTerm(value)
        if (value.length >= 2 || value.length === 0) {
            fetchCustomers(value)
        }
    }

    const openCreateModal = () => {
        setEditingCustomer(null)
        setFormData({
            name: '',
            rif: '',
            phone: '',
            email: '',
            address: '',
            isSpecialTaxpayer: false,
        })
        setShowModal(true)
    }

    const openEditModal = (customer: Customer) => {
        setEditingCustomer(customer)
        setFormData({
            name: customer.name,
            rif: customer.rif,
            phone: customer.phone || '',
            email: customer.email || '',
            address: customer.address || '',
            isSpecialTaxpayer: customer.isSpecialTaxpayer,
        })
        setShowModal(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const url = editingCustomer
                ? `/api/customers/${editingCustomer.id}`
                : '/api/customers'

            const method = editingCustomer ? 'PATCH' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await res.json()

            if (data.success) {
                setShowModal(false)
                fetchCustomers(searchTerm)
            } else {
                alert(data.error || 'Error al guardar cliente')
            }
        } catch (error) {
            console.error('Error saving customer:', error)
            alert('Error al guardar cliente')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este cliente?')) return

        try {
            const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' })
            const data = await res.json()

            if (data.success) {
                fetchCustomers(searchTerm)
            } else {
                alert(data.error || 'Error al eliminar cliente')
            }
        } catch (error) {
            console.error('Error deleting customer:', error)
            alert('Error al eliminar cliente')
        }
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Clientes</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Gestiona tu base de clientes
                    </p>
                </div>
                <Button onClick={openCreateModal}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Cliente
                </Button>
            </div>

            {/* Search */}
            <Card className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        placeholder="Buscar por nombre, RIF, email o teléfono..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </Card>

            {/* Customers List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    <p className="mt-2 text-gray-600">Cargando clientes...</p>
                </div>
            ) : customers.length === 0 ? (
                <Card className="p-12 text-center">
                    <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">No hay clientes</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {searchTerm
                            ? 'No se encontraron clientes con ese criterio'
                            : 'Comienza agregando tu primer cliente'}
                    </p>
                    {!searchTerm && (
                        <Button onClick={openCreateModal}>
                            <Plus className="w-4 h-4 mr-2" />
                            Crear Primer Cliente
                        </Button>
                    )}
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customers.map((customer) => (
                        <Card key={customer.id} className="p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-1">{customer.name}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        RIF: {customer.rif}
                                    </p>
                                </div>
                                {customer.isSpecialTaxpayer && (
                                    <span className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 px-2 py-1 rounded">
                                        Especial
                                    </span>
                                )}
                            </div>

                            <div className="space-y-2 text-sm mb-4">
                                {customer.phone && (
                                    <p className="text-gray-600 dark:text-gray-400">
                                        📞 {customer.phone}
                                    </p>
                                )}
                                {customer.email && (
                                    <p className="text-gray-600 dark:text-gray-400">
                                        ✉️ {customer.email}
                                    </p>
                                )}
                                {customer.address && (
                                    <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                                        📍 {customer.address}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEditModal(customer)}
                                    className="flex-1"
                                >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Editar
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(customer.id)}
                                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal Create/Edit */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">
                                    {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
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
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-2">
                                            Nombre Completo *
                                        </label>
                                        <Input
                                            required
                                            placeholder="Nombre del cliente o empresa"
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({ ...formData, name: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            RIF / CI *
                                        </label>
                                        <Input
                                            required
                                            placeholder="J-123456789 o V-12345678"
                                            value={formData.rif}
                                            onChange={(e) =>
                                                setFormData({ ...formData, rif: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Teléfono
                                        </label>
                                        <Input
                                            type="tel"
                                            placeholder="0412-1234567"
                                            value={formData.phone}
                                            onChange={(e) =>
                                                setFormData({ ...formData, phone: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-2">
                                            Email
                                        </label>
                                        <Input
                                            type="email"
                                            placeholder="cliente@ejemplo.com"
                                            value={formData.email}
                                            onChange={(e) =>
                                                setFormData({ ...formData, email: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-2">
                                            Dirección
                                        </label>
                                        <textarea
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
                                            rows={3}
                                            placeholder="Dirección completa"
                                            value={formData.address}
                                            onChange={(e) =>
                                                setFormData({ ...formData, address: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.isSpecialTaxpayer}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        isSpecialTaxpayer: e.target.checked,
                                                    })
                                                }
                                                className="w-4 h-4 rounded border-gray-300"
                                            />
                                            <span className="text-sm font-medium">
                                                Contribuyente Especial (75% retención IVA)
                                            </span>
                                        </label>
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
                                        {editingCustomer ? 'Actualizar' : 'Crear'} Cliente
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
