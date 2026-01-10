import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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
        // Get session to get user's company
        const session = await getServerSession(authOptions)
        if (!session?.user?.companyId) {
            return NextResponse.json(
                { success: false, error: 'Debes iniciar sesión para importar productos' },
                { status: 401 }
            )
        }

        const companyId = session.user.companyId

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

        // Helper function for case-insensitive and alias key lookup
        const getValue = (row: any, searchKeys: string[]) => {
            const rowKeys = Object.keys(row)
            for (const searchKey of searchKeys) {
                // Exact match
                if (row[searchKey] !== undefined) return row[searchKey]

                // Case insensitive match
                const foundKey = rowKeys.find(k =>
                    k.toLowerCase().trim() === searchKey.toLowerCase().trim()
                )
                if (foundKey && row[foundKey] !== undefined) return row[foundKey]
            }
            return undefined
        }

        for (let i = 0; i < data.length; i++) {
            const row = data[i]
            const rowNum = i + 2 // +2 because Excel 1-indexed + header

            // Flexible field extraction
            const rawSku = getValue(row, ['SKU', 'CODIGO', 'CODE'])
            const rawRef = getValue(row, ['REFERENCIA', 'REF', 'MODELO'])
            const rawCat = getValue(row, ['CATEGORIA', 'CATEGORY', 'DEPARTAMENTO'])
            const rawName = getValue(row, ['DESCRIPCION', 'NOMBRE', 'PRODUCTO', 'NAME'])
            const rawBrand = getValue(row, ['MARCA', 'BRAND', 'FABRICANTE'])
            const rawLoc = getValue(row, ['UBICACION', 'LOCATION', 'UBICACIÓN']) // Handle accent

            const rawPrice = getValue(row, ['PRECIO VENTA USD', 'PRECIO', 'PRECIO USD', 'PRICE'])
            const rawCost = getValue(row, ['COSTO', 'COSTO USD', 'COST'])
            const rawStock = getValue(row, ['EXISTENCIA', 'STOCK', 'CANTIDAD'])
            const rawMin = getValue(row, ['STOCK MINIMO', 'MIN STOCK', 'MINIMO'])

            // Validate required fields
            const sku = rawSku?.toString().trim()
            const referencia = rawRef?.toString().trim()
            const categoria = rawCat?.toString().trim()

            if (!sku) {
                results.errors.push(`Fila ${rowNum}: SKU es requerido (Columna: SKU)`)
                continue
            }
            if (!referencia) {
                results.errors.push(`Fila ${rowNum}: REFERENCIA es requerida (Columna: REFERENCIA)`)
                continue
            }
            if (!categoria) {
                results.errors.push(`Fila ${rowNum}: CATEGORIA es requerida (Columna: CATEGORIA)`)
                continue
            }

            // Prepare product data
            const priceUSD = Number(rawPrice) || 0
            const costUSD = Number(rawCost) || 0
            const stock = Number(rawStock) || 0
            const minStock = Number(rawMin) || 0

            const productData = {
                name: rawName?.toString().trim() || sku,
                reference: referencia,
                description: rawName?.toString().trim() || null,
                category: categoria,
                brand: rawBrand?.toString().trim() || null,
                location: rawLoc?.toString().trim() || null,
                priceUSD,
                priceBS: priceUSD * bcvRate,
                costUSD,
                costBS: costUSD * bcvRate,
                stock,
                minStock,
                isActive: true,
            }

            try {
                // Upsert: create or update
                const existing = await prisma.product.findFirst({
                    where: { companyId, sku }
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
                            companyId,
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
