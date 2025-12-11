'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
    FileText,
    Download,
    Plus,
    Eye,
    CheckCircle2,
} from 'lucide-react'
import { formatCurrency, formatShortDate } from '@/lib/utils'

export default function RetencionesIVAPage() {
    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold mb-2">Retenciones de IVA</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Gestión de retenciones de IVA según normativa SENIAT
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Exportar TXT
                    </Button>
                    <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Exportar XML
                    </Button>
                    <Button variant="primary">
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Retención
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card variant="glass">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Retenciones del Mes
                    </p>
                    <h3 className="text-2xl font-bold mb-2">45</h3>
                    <Badge variant="info">Diciembre 2024</Badge>
                </Card>

                <Card variant="glass">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Total Retenido
                    </p>
                    <h3 className="text-2xl font-bold mb-2">{formatCurrency(15036.06)}</h3>
                    <div className="text-xs text-gray-500">75% del IVA aplicable</div>
                </Card>

                <Card variant="glass">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Declaradas
                    </p>
                    <h3 className="text-2xl font-bold mb-2">42</h3>
                    <Badge variant="success">93% Cumplimiento</Badge>
                </Card>

                <Card variant="glass">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Pendientes
                    </p>
                    <h3 className="text-2xl font-bold mb-2">3</h3>
                    <Badge variant="warning">Por Declarar</Badge>
                </Card>
            </div>

            {/* Alert */}
            <Card variant="glass" className="border-l-4 border-info-500 bg-info-50/50 dark:bg-info-900/10">
                <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-info-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-info-900 dark:text-info-100 mb-1">
                            Formato SENIAT
                        </h3>
                        <p className="text-sm text-info-800 dark:text-info-200">
                            Las retenciones se pueden exportar en formato TXT y XML según las especificaciones del SENIAT para su declaración mensual.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Withholdings Table */}
            <Card variant="glass">
                <h2 className="text-xl font-display font-semibold mb-6">
                    Comprobantes de Retención
                </h2>

                <div className="overflow-x-auto">
                    <table className="table-modern">
                        <thead>
                            <tr>
                                <th>Comprobante</th>
                                <th>Fecha</th>
                                <th>Proveedor/Cliente</th>
                                <th>Factura</th>
                                <th className="text-right">Base Imponible</th>
                                <th className="text-right">% Retención</th>
                                <th className="text-right">Monto Retenido</th>
                                <th>Estado</th>
                                <th className="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {withholdings.map((item, index) => (
                                <tr key={index}>
                                    <td className="font-mono font-semibold">{item.receiptNumber}</td>
                                    <td>{formatShortDate(item.date)}</td>
                                    <td>
                                        <div>
                                            <div className="font-medium">{item.entity}</div>
                                            <div className="text-xs text-gray-500">{item.rif}</div>
                                        </div>
                                    </td>
                                    <td className="font-mono text-sm">{item.invoiceNumber}</td>
                                    <td className="text-right">{formatCurrency(item.baseAmount)}</td>
                                    <td className="text-right">{item.withholdingRate}%</td>
                                    <td className="text-right font-semibold text-primary-600">
                                        {formatCurrency(item.withheldAmount)}
                                    </td>
                                    <td>
                                        <Badge variant={
                                            item.status === 'reported' ? 'success' :
                                                item.status === 'pending' ? 'warning' :
                                                    'default'
                                        }>
                                            {item.status === 'reported' ? (
                                                <div className="flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Declarada
                                                </div>
                                            ) : 'Pendiente'}
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
            </Card>
        </div>
    )
}

const withholdings = [
    {
        receiptNumber: 'RET-001245',
        date: new Date('2024-12-10'),
        entity: 'Distribuidora El Sol C.A.',
        rif: 'J-12345678-9',
        invoiceNumber: '00125',
        baseAmount: 12500.00,
        withholdingRate: 75,
        withheldAmount: 1500.00,
        status: 'reported'
    },
    {
        receiptNumber: 'RET-001244',
        date: new Date('2024-12-10'),
        entity: 'Importadora Luna S.A.',
        rif: 'J-98765432-1',
        invoiceNumber: '00123',
        baseAmount: 15420.50,
        withholdingRate: 75,
        withheldAmount: 1850.46,
        status: 'pending'
    },
    {
        receiptNumber: 'RET-001243',
        date: new Date('2024-12-09'),
        entity: 'Suministros Generales',
        rif: 'J-55544433-2',
        invoiceNumber: '8821',
        baseAmount: 8300.00,
        withholdingRate: 75,
        withheldAmount: 996.00,
        status: 'reported'
    },
    {
        receiptNumber: 'RET-001242',
        date: new Date('2024-12-08'),
        entity: 'Materiales Construcción',
        rif: 'J-11122233-3',
        invoiceNumber: '5521',
        baseAmount: 18300.00,
        withholdingRate: 100,
        withheldAmount: 2928.00,
        status: 'reported'
    },
    {
        receiptNumber: 'RET-001241',
        date: new Date('2024-12-07'),
        entity: 'Electrónica Digital C.A.',
        rif: 'J-22233344-4',
        invoiceNumber: '9954',
        baseAmount: 22100.00,
        withholdingRate: 75,
        withheldAmount: 2652.00,
        status: 'pending'
    },
]
