'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
    Plus,
    Search,
    Filter,
    Download,
    Eye,
    FileText,
} from 'lucide-react'
import { formatCurrency, formatShortDate } from '@/lib/utils'

export default function VentasPage() {
    const [searchTerm, setSearchTerm] = useState('')

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold mb-2">Libro de Ventas</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Registro de todas tus ventas y facturaciones
                    </p>
                </div>

                <Link href="/dashboard/ventas/nueva">
                    <Button variant="primary" size="lg">
                        <Plus className="w-5 h-5 mr-2" />
                        Nueva Venta
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card variant="glass">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                Total del Mes
                            </p>
                            <h3 className="text-2xl font-bold">{formatCurrency(125450.50)}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center text-white">
                            <FileText className="w-6 h-6" />
                        </div>
                    </div>
                </Card>

                <Card variant="glass">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                IVA Cobrado
                            </p>
                            <h3 className="text-2xl font-bold">{formatCurrency(20072.08)}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-info-500 to-info-600 flex items-center justify-center text-white">
                            <FileText className="w-6 h-6" />
                        </div>
                    </div>
                </Card>

                <Card variant="glass">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                Facturas Emitidas
                            </p>
                            <h3 className="text-2xl font-bold">128</h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white">
                            <FileText className="w-6 h-6" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card variant="glass">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Buscar por cliente, factura..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={<Search className="w-5 h-5" />}
                        />
                    </div>

                    <Button variant="outline">
                        <Filter className="w-4 h-4 mr-2" />
                        Filtros
                    </Button>

                    <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Exportar TXT/XML
                    </Button>
                </div>
            </Card>

            {/* Sales Table */}
            <Card variant="glass">
                <div className="overflow-x-auto">
                    <table className="table-modern">
                        <thead>
                            <tr>
                                <th>Factura</th>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th className="text-right">Subtotal</th>
                                <th className="text-right">IVA</th>
                                <th className="text-right">Total</th>
                                <th>Estado</th>
                                <th className="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map((sale, index) => (
                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="font-mono font-semibold">{sale.invoiceNumber}</td>
                                    <td>{formatShortDate(sale.date)}</td>
                                    <td>{sale.customer}</td>
                                    <td className="text-right">{formatCurrency(sale.subtotal)}</td>
                                    <td className="text-right">{formatCurrency(sale.tax)}</td>
                                    <td className="text-right font-semibold">{formatCurrency(sale.total)}</td>
                                    <td>
                                        <Badge variant={
                                            sale.status === 'paid' ? 'success' :
                                                sale.status === 'pending' ? 'warning' :
                                                    sale.status === 'partial' ? 'info' :
                                                        'danger'
                                        }>
                                            {sale.status === 'paid' ? 'Pagada' :
                                                sale.status === 'pending' ? 'Pendiente' :
                                                    sale.status === 'partial' ? 'Parcial' :
                                                        'Vencida'}
                                        </Badge>
                                    </td>
                                    <td>
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Mostrando 1 a 10 de 128 registros
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">Anterior</Button>
                        <Button variant="outline" size="sm">1</Button>
                        <Button variant="primary" size="sm">2</Button>
                        <Button variant="outline" size="sm">3</Button>
                        <Button variant="outline" size="sm">Siguiente</Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}

const sales = [
    { invoiceNumber: '00125', date: new Date('2024-12-10'), customer: 'Distribuidora El Sol C.A.', subtotal: 12500.00, tax: 2000.00, total: 14500.00, status: 'paid' },
    { invoiceNumber: '00124', date: new Date('2024-12-10'), customer: 'Comercial ABC', subtotal: 8750.00, tax: 1400.00, total: 10150.00, status: 'pending' },
    { invoiceNumber: '00123', date: new Date('2024-12-09'), customer: 'Importadora Luna S.A.', subtotal: 15420.50, tax: 2467.28, total: 17887.78, status: 'paid' },
    { invoiceNumber: '00122', date: new Date('2024-12-09'), customer: 'Suministros Generales', subtotal: 6200.00, tax: 992.00, total: 7192.00, status: 'partial' },
    { invoiceNumber: '00121', date: new Date('2024-12-08'), customer: 'Ferretería Central', subtotal: 9850.75, tax: 1576.12, total: 11426.87, status: 'paid' },
    { invoiceNumber: '00120', date: new Date('2024-12-08'), customer: 'Materiales Construcción', subtotal: 18300.00, tax: 2928.00, total: 21228.00, status: 'overdue' },
    { invoiceNumber: '00119', date: new Date('2024-12-07'), customer: 'Auto Partes Premium', subtotal: 11400.25, tax: 1824.04, total: 13224.29, status: 'paid' },
    { invoiceNumber: '00118', date: new Date('2024-12-07'), customer: 'Electrónica Digital C.A.', subtotal: 22100.00, tax: 3536.00, total: 25636.00, status: 'paid' },
]
