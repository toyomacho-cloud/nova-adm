import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface ExcelRow {
    SKU?: string
    REFERENCIA?: string
    DESCRIPCION?: string
    CATEGORIA?: string
    MARCA?: string
    UBICACION?: string
    'PRECIO VENTA USD'?: number
    COSTO?: number
    EXISTENCIA?: number
    'STOCK MINIMO'?: number
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No se proporcionó archivo' },
                { status: 400 }
            )
        }

        // Leer archivo Excel
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet)

        if (data.length === 0) {
            return NextResponse.json(
                { success: false, error: 'El archivo está vacío' },
                { status: 400 }
            )
        }

        // Obtener empresa (usando la primera disponible por ahora)
        const company = await prisma.company.findFirst()
        if (!company) {
            return NextResponse.json(
                { success: false, error: 'No hay empresa configurada' },
                { status: 400 }
            )
        }

        // Obtener tasa BCV para calcular precio en Bs
        let bcvRate = 285.40 // Default
        const rate = await prisma.exchangeRate.findFirst({
            where: { currency: 'USD' },
            orderBy: { date: 'desc' }
        })
        if (rate) {
            bcvRate = rate.rate
        }

        // Procesar productos
        const results = {
            created: 0,
            updated: 0,
            errors: [] as string[]
        }

        for (let i = 0; i < data.length; i++) {
            const row = data[i]
            const rowNum = i + 2 // +2 porque Excel empieza en 1 y tiene encabezado

            // Validar campos requeridos
            const sku = row.SKU?.toString().trim()
            const referencia = row.REFERENCIA?.toString().trim()
            const categoria = row.CATEGORIA?.toString().trim()

            if (!sku) {
                results.errors.push(`Fila ${rowNum}: SKU es requerido`)
                continue
            }
            if (!referencia) {
                results.errors.push(`Fila ${rowNum}: REFERENCIA es requerida`)
                continue
            }
            if (!categoria) {
                results.errors.push(`Fila ${rowNum}: CATEGORIA es requerida`)
                continue
            }

            // Preparar datos del producto
            const priceUSD = Number(row['PRECIO VENTA USD']) || 0
            const costUSD = Number(row.COSTO) || 0
            const stock = Number(row.EXISTENCIA) || 0
            const minStock = Number(row['STOCK MINIMO']) || 0

            const productData = {
                name: row.DESCRIPCION?.toString().trim() || sku,
                reference: referencia,
                description: row.DESCRIPCION?.toString().trim() || null,
                category: categoria,
                brand: row.MARCA?.toString().trim() || null,
                location: row.UBICACION?.toString().trim() || null,
                priceUSD,
                priceBS: priceUSD * bcvRate,
                costUSD,
                costBS: costUSD * bcvRate,
                stock,
                minStock,
                isActive: true,
            }

            try {
                // Upsert: crear o actualizar
                const existing = await prisma.product.findFirst({
                    where: { companyId: company.id, sku }
                })

                if (existing) {
                    await prisma.product.update({
                        where: { id: existing.id },
                        data: productData
                    })
                    results.updated++
                } else {
                    await prisma.product.create({
                        data: {
                            companyId: company.id,
                            sku,
                            ...productData
                        }
                    })
                    results.created++
                }
            } catch (err) {
                results.errors.push(`Fila ${rowNum}: Error al guardar - ${err}`)
            }
        }

        return NextResponse.json({
            success: true,
            message: `Importación completada`,
            created: results.created,
            updated: results.updated,
            errors: results.errors.slice(0, 10) // Limitar errores mostrados
        })

    } catch (error) {
        console.error('Error importing products:', error)
        return NextResponse.json(
            { success: false, error: 'Error al procesar el archivo' },
            { status: 500 }
        )
    }
}
