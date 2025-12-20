'use client'

import { useState, useEffect } from 'react'
import { Building2, Save } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ConfiguracionPage() {
    const [company, setCompany] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        rif: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        taxRate: 16,
    })

    useEffect(() => {
        fetchCompany()
    }, [])

    const fetchCompany = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/company')
            const data = await res.json()
            if (data.success && data.company) {
                setCompany(data.company)
                setFormData({
                    name: data.company.name || '',
                    rif: data.company.rif || '',
                    address: data.company.address || '',
                    phone: data.company.phone || '',
                    email: data.company.email || '',
                    website: data.company.website || '',
                    taxRate: data.company.defaultTaxRate || 16,
                })
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
            setSaving(true)
            const res = await fetch('/api/company', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await res.json()

            if (data.success) {
                alert('✅ Configuración guardada exitosamente')
                fetchCompany()
            } else {
                alert(`❌ Error: ${data.error}`)
            }
        } catch (error) {
            alert('Error al guardar configuración')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-primary-500" />
                <div>
                    <h1 className="text-3xl font-bold">Configuración</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Datos de tu empresa
                    </p>
                </div>
            </div>

            <Card>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-bold">Información de la Empresa</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Nombre de la Empresa *
                            </label>
                            <Input
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Mi Empresa C.A."
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
                                placeholder="+58 412 1234567"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Email</label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="contacto@miempresa.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Sitio Web</label>
                            <Input
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                placeholder="https://miempresa.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Tasa de IVA (%)
                            </label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={formData.taxRate}
                                onChange={(e) =>
                                    setFormData({ ...formData, taxRate: parseFloat(e.target.value) })
                                }
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Dirección</label>
                        <textarea
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                            rows={3}
                            placeholder="Dirección completa de la empresa"
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={fetchCompany}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? (
                                <>
                                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Guardar Cambios
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </Card>

            <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                    <Building2 className="w-6 h-6 text-blue-600 mt-1" />
                    <div>
                        <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
                            Información Importante
                        </h3>
                        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                            <li>• Estos datos aparecerán en tus facturas y documentos</li>
                            <li>• El RIF debe ser único y válido</li>
                            <li>• La tasa de IVA por defecto es 16% en Venezuela</li>
                        </ul>
                    </div>
                </div>
            </Card>
        </div>
    )
}
