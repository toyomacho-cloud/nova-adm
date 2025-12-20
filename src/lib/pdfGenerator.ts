import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Sale {
    id: string
    invoiceNumber: string
    saleNumber: string
    invoiceDate: string
    subtotal: number
    taxAmount: number
    total: number
    bcvRate?: number
    customer: {
        name: string
        rif: string
        address?: string
        phone?: string
        email?: string
    }
    items: Array<{
        description: string
        quantity: number
        unitPrice: number
        subtotal: number
        taxAmount: number
        total: number
    }>
    paymentMethod: {
        name: string
    }
}

export function generateInvoicePDF(sale: Sale, company: any) {
    const doc = new jsPDF()

    // Company header
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(company?.name || 'NOVA-ADM', 105, 20, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(company?.rif || 'RIF: J-123456789', 105, 27, { align: 'center' })
    if (company?.address) {
        doc.text(company.address, 105, 32, { align: 'center' })
    }
    if (company?.phone) {
        doc.text(`Tel: ${company.phone}`, 105, 37, { align: 'center' })
    }

    // Invoice info
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('FACTURA', 105, 50, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Factura: ${sale.invoiceNumber}`, 20, 60)
    doc.text(`Fecha: ${new Date(sale.invoiceDate).toLocaleDateString('es-VE')}`, 20, 65)

    // Customer info
    doc.setFont('helvetica', 'bold')
    doc.text('CLIENTE:', 20, 75)
    doc.setFont('helvetica', 'normal')
    doc.text(sale.customer.name, 20, 80)
    doc.text(`RIF: ${sale.customer.rif}`, 20, 85)
    if (sale.customer.address) {
        doc.text(sale.customer.address, 20, 90)
    }

    // Items table
    const tableData = sale.items.map((item) => [
        item.description,
        item.quantity.toString(),
        `$${item.unitPrice.toFixed(2)}`,
        `$${item.subtotal.toFixed(2)}`,
    ])

    autoTable(doc, {
        startY: 100,
        head: [['Descripción', 'Cant.', 'Precio Unit.', 'Subtotal']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
    })

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY || 100
    const totalsX = 130

    doc.setFont('helvetica', 'normal')
    doc.text('Subtotal:', totalsX, finalY + 10)
    doc.text(`$${sale.subtotal.toFixed(2)}`, 180, finalY + 10, { align: 'right' })

    doc.text('IVA (16%):', totalsX, finalY + 17)
    doc.text(`$${sale.taxAmount.toFixed(2)}`, 180, finalY + 17, { align: 'right' })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('TOTAL:', totalsX, finalY + 27)
    doc.text(`$${sale.total.toFixed(2)}`, 180, finalY + 27, { align: 'right' })

    // BCV rate if available
    if (sale.bcvRate) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'italic')
        doc.text(`Tasa BCV: Bs. ${sale.bcvRate.toFixed(2)}`, totalsX, finalY + 35)
        doc.text(`Total Bs.: ${(sale.total * sale.bcvRate).toFixed(2)}`, totalsX, finalY + 40)
    }

    // Payment method
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Método de pago: ${sale.paymentMethod.name}`, 20, finalY + 50)

    // Footer
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.text('Gracias por su compra', 105, 280, { align: 'center' })

    return doc
}

export function downloadInvoicePDF(sale: Sale, company: any) {
    const doc = generateInvoicePDF(sale, company)
    doc.save(`Factura_${sale.invoiceNumber}.pdf`)
}

export function printInvoicePDF(sale: Sale, company: any) {
    const doc = generateInvoicePDF(sale, company)
    doc.autoPrint()
    window.open(doc.output('bloburl'), '_blank')
}
