import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
    try {
        const headers = [
            'SKU',
            'REFERENCIA',
            'DESCRIPCION',
            'CATEGORIA',
            'MARCA',
            'UBICACION',
            'PRECIO VENTA USD',
            'COSTO',
            'EXISTENCIA',
            'STOCK MINIMO'
        ]

        const exampleRow = [
            'PROD-001',
            'REF-001',
            'Aceite de Motor 20W50',
            'Lubricantes',
            'Shell',
            'Estante A1',
            12.50,
            8.00,
            100,
            10
        ]

        const workbook = XLSX.utils.book_new()
        const worksheet = XLSX.utils.aoa_to_sheet([headers, exampleRow])

        // Adjust column widths
        const wscols = headers.map(h => ({ wch: h.length + 5 }))
        worksheet['!cols'] = wscols

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla')

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="plantilla_productos.xlsx"'
            }
        })
    } catch (error) {
        console.error('Error creating template:', error)
        return NextResponse.json(
            { success: false, error: 'Error al generar plantilla' },
            { status: 500 }
        )
    }
}
