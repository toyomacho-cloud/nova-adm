import * as XLSX from 'xlsx'

interface ReportData {
    [key: string]: any
}

export function exportToExcel(data: ReportData[], filename: string, sheetName: string = 'Reporte') {
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(data)

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName)

    // Generate Excel file
    XLSX.writeFile(wb, `${filename}.xlsx`)
}

export function exportSalesReport(sales: any[], period: string) {
    const data = sales.map((sale) => ({
        'Nro. Factura': sale.invoiceNumber,
        'Fecha': new Date(sale.invoiceDate).toLocaleDateString('es-VE'),
        'Cliente': sale.customer.name,
        'RIF': sale.customer.rif,
        'Subtotal USD': sale.subtotal,
        'IVA USD': sale.taxAmount,
        'Total USD': sale.total,
        'Método Pago': sale.paymentMethod?.name || 'N/A',
    }))

    exportToExcel(data, `Ventas_${period}`, 'Ventas')
}

export function exportFinancialReport(metrics: any, period: string) {
    const data = [
        { Concepto: 'Ingresos por Ventas', 'Monto USD': metrics.revenue?.total || 0 },
        { Concepto: 'Costos de Ventas', 'Monto USD': -(metrics.costs?.total || 0) },
        { Concepto: 'Ganancia Bruta', 'Monto USD': metrics.profit?.gross || 0 },
        { Concepto: 'Margen %', 'Monto USD': metrics.profit?.margin || 0 },
        { Concepto: '', 'Monto USD': '' },
        { Concepto: 'Cuentas por Cobrar', 'Monto USD': metrics.receivables?.total || 0 },
        { Concepto: 'Valor Inventario', 'Monto USD': metrics.inventory?.value || 0 },
        { Concepto: 'Productos Bajo Stock', 'Monto USD': metrics.inventory?.lowStock || 0 },
    ]

    exportToExcel(data, `Reporte_Financiero_${period}`, 'Financiero')
}

export function exportWithholdingsReport(
    withholdings: any[],
    type: 'iva' | 'islr' | 'municipal',
    period: string
) {
    const data = withholdings.map((w) => ({
        'Nro. Retención': w.withholdingNumber,
        'Fecha': new Date(w.withholdingDate || w.receiptDate).toLocaleDateString('es-VE'),
        'Cliente': w.customer?.name || 'N/A',
        'RIF': w.customer?.rif || 'N/A',
        'Tasa %': w.rate || w.withholdingRate || 0,
        'Base USD': w.baseAmountUSD || w.baseAmount || 0,
        'Retenido USD': w.withholdingAmountUSD || w.withholdingAmount || 0,
    }))

    exportToExcel(data, `Retenciones_${type.toUpperCase()}_${period}`, `Ret. ${type.toUpperCase()}`)
}

export function exportFiscalBook(
    transactions: any[],
    type: 'sales' | 'purchases',
    period: string
) {
    const data = transactions.map((t) => ({
        'Nro. Factura': t.invoiceNumber,
        'Fecha': new Date(t.invoiceDate).toLocaleDateString('es-VE'),
        'Entidad': type === 'sales' ? t.customer.name : t.vendor.name,
        'RIF': type === 'sales' ? t.customer.rif : t.vendor.rif,
        'Base Imponible': t.subtotal,
        'IVA': t.taxAmount,
        'Total': t.total,
    }))

    const sheetName = type === 'sales' ? 'Libro de Ventas' : 'Libro de Compras'
    exportToExcel(data, `Libro_${type === 'sales' ? 'Ventas' : 'Compras'}_${period}`, sheetName)
}
