'use client'

import { useState, useEffect } from 'react'
import { Calendar, Download, FileText, BarChart3 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function ReportesSENIATPage() {
    const [report, setReport] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [month, setMonth] = useState(new Date().getMonth() + 1)
    const [year, setYear] = useState(new Date().getFullYear())

    useEffect(() => {
        fetchReport()
    }, [month, year])

    const fetchReport = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/reports/seniat?month=${month}&year=${year}`)
            const data = await res.json()
            if (data.success) {
                setReport(data)
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const exportToTxt = (type: 'iva' | 'islr' | 'municipal') => {
        if (!report) return

        const data = report.detail[`${type}Withholdings`]
        let content = ''

        // SENIAT header format
        content += `COMPROBANTE DE RETENCIONES - ${type.toUpperCase()}\n`
        content += `PERIODO: ${month.toString().padStart(2, '0')}/${year}\n`
        content += `FECHA GENERACION: ${new Date().toLocaleDateString('es-VE')}\n`
        content += '='.repeat(80) + '\n\n'

        // Detail rows
        data.forEach((w: any, index: number) => {
            content += `${(index + 1).toString().padStart(4, '0')} | `
            content += `${w.withholdingNumber.padEnd(20)} | `
            content += `${w.customer.rif.padEnd(15)} | `
            content += `${w.customer.name.substring(0, 30).padEnd(30)} | `
            content += `${w.baseAmountBS.toFixed(2).padStart(15)} | `
            content += `${w.withholdingAmountBS.toFixed(2).padStart(15)}\n`
        })

        // Footer
        content += '\n' + '='.repeat(80) + '\n'
        content += `TOTAL REGISTROS: ${data.length}\n`
        content += `TOTAL RETENIDO: ${report.totals[type].totalWithheldBS.toFixed(2)} Bs.\n`

        // Download
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `SENIAT_${type.toUpperCase()}_${month.toString().padStart(2, '0')}_${year}.txt`
        link.click()
        URL.revokeObjectURL(url)
    }

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(value)

    const MONTHS = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ]

    if (loading) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    <p className="mt-2 text-gray-600">Generando reporte SENIAT...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Reportes SENIAT</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Consolidado mensual de retenciones y ventas
                    </p>
                </div>
                <div className="flex gap-2">
                    <select
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    >
                        {MONTHS.map((m, i) => (
                            <option key={i} value={i + 1}>
                                {m}
                            </option>
                        ))}
                    </select>
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    >
                        {[2025, 2024, 2023].map((y) => (
                            <option key={y} value={y}>
                                {y}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Ventas</h3>
                        <BarChart3 className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold">{report?.totals.sales.count || 0}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        ${formatCurrency(report?.totals.sales.totalUSD || 0)}
                    </p>
                </Card>

                <Card className="p-6 bg-green-50 dark:bg-green-900/20">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">IVA Retenido</h3>
                        <FileText className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                        {report?.totals.iva.count || 0}
                    </p>
                    <p className="text-sm text-green-600">
                        ${formatCurrency(report?.totals.iva.totalWithheldUSD || 0)}
                    </p>
                </Card>

                <Card className="p-6 bg-purple-50 dark:bg-purple-900/20">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">ISLR Retenido</h3>
                        <FileText className="w-5 h-5 text-purple-500" />
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
                        {report?.totals.islr.count || 0}
                    </p>
                    <p className="text-sm text-purple-600">
                        ${formatCurrency(report?.totals.islr.totalWithheldUSD || 0)}
                    </p>
                </Card>

                <Card className="p-6 bg-orange-50 dark:bg-orange-900/20">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Municipal</h3>
                        <FileText className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-2xl font-bold text-orange-600">
                        {report?.totals.municipal.count || 0}
                    </p>
                    <p className="text-sm text-orange-600">
                        ${formatCurrency(report?.totals.municipal.totalWithheldUSD || 0)}
                    </p>
                </Card>
            </div>

            {/* Export Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                    <h3 className="font-bold mb-4 text-green-600">Retenciones IVA</h3>
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                            <span>Comprobantes:</span>
                            <span className="font-medium">{report?.totals.iva.count}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Total USD:</span>
                            <span className="font-medium">${formatCurrency(report?.totals.iva.totalWithheldUSD || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Total Bs:</span>
                            <span className="font-medium">Bs. {formatCurrency(report?.totals.iva.totalWithheldBS || 0)}</span>
                        </div>
                    </div>
                    <Button
                        onClick={() => exportToTxt('iva')}
                        disabled={!report?.totals.iva.count}
                        className="w-full bg-green-600 hover:bg-green-700"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Exportar .TXT
                    </Button>
                </Card>

                <Card className="p-6">
                    <h3 className="font-bold mb-4 text-purple-600">Retenciones ISLR</h3>
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                            <span>Comprobantes:</span>
                            <span className="font-medium">{report?.totals.islr.count}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Total USD:</span>
                            <span className="font-medium">${formatCurrency(report?.totals.islr.totalWithheldUSD || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Total Bs:</span>
                            <span className="font-medium">Bs. {formatCurrency(report?.totals.islr.totalWithheldBS || 0)}</span>
                        </div>
                    </div>
                    <Button
                        onClick={() => exportToTxt('islr')}
                        disabled={!report?.totals.islr.count}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Exportar .TXT
                    </Button>
                </Card>

                <Card className="p-6">
                    <h3 className="font-bold mb-4 text-orange-600">Retenciones Municipales</h3>
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                            <span>Comprobantes:</span>
                            <span className="font-medium">{report?.totals.municipal.count}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Total USD:</span>
                            <span className="font-medium">${formatCurrency(report?.totals.municipal.totalWithheldUSD || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Total Bs:</span>
                            <span className="font-medium">Bs. {formatCurrency(report?.totals.municipal.totalWithheldBS || 0)}</span>
                        </div>
                    </div>
                    <Button
                        onClick={() => exportToTxt('municipal')}
                        disabled={!report?.totals.municipal.count}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Exportar .TXT
                    </Button>
                </Card>
            </div>

            {/* Summary Note */}
            <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                    <Calendar className="w-6 h-6 text-blue-600 mt-1" />
                    <div>
                        <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
                            Período: {MONTHS[month - 1]} {year}
                        </h3>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            Los archivos .TXT generados están en el formato requerido por el portal SENIAT para la declaración mensual.
                            Asegúrate de validar los datos antes de enviar.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    )
}
