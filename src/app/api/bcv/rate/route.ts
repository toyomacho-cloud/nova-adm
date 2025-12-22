import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    // Intentar obtener tasa de múltiples APIs
    let usdRate = null
    let source = 'UNKNOWN'
    let lastUpdate = new Date().toISOString()

    // API 1: ve.dolarapi.com (funcional y confiable)
    try {
      const res1 = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
        next: { revalidate: 3600 }
      })
      if (res1.ok) {
        const data = await res1.json()
        usdRate = data.promedio || data.venta || null
        source = 've.dolarapi.com'
      }
    } catch (e) {
      console.log('ve.dolarapi.com failed:', e)
    }

    // API 2: Fallback - bcvapi.tech
    if (!usdRate) {
      try {
        const res2 = await fetch('https://bcvapi.tech/api/rates/bcv', {
          next: { revalidate: 3600 }
        })
        if (res2.ok) {
          const data = await res2.json()
          usdRate = data.rates?.USD || data.USD || null
          source = 'bcvapi.tech'
        }
      } catch (e) {
        console.log('bcvapi.tech failed:', e)
      }
    }

    // API 3: Fallback - pydolarve.org
    if (!usdRate) {
      try {
        const res3 = await fetch('https://pydolarve.org/api/v1/dollar?monitor=bcv', {
          next: { revalidate: 3600 }
        })
        if (res3.ok) {
          const data = await res3.json()
          usdRate = data.price || null
          source = 'pydolarve.org'
        }
      } catch (e) {
        console.log('pydolarve.org failed:', e)
      }
    }

    // Si ninguna API funcionó, usar DB como fallback
    if (!usdRate) {
      const lastRate = await prisma.exchangeRate.findFirst({
        where: { currency: 'USD' },
        orderBy: { date: 'desc' }
      })

      if (lastRate) {
        return NextResponse.json({
          success: true,
          rate: lastRate.rate,
          lastUpdate: lastRate.date.toISOString(),
          source: 'DB_CACHE',
          warning: 'Usando tasa en caché - APIs no disponibles'
        })
      }

      // Último fallback: tasa hardcoded del día
      usdRate = 53.50 // Tasa oficial BCV aproximada dic 2024
      source = 'FALLBACK'
    }

    // Guardar en base de datos
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const existingRate = await prisma.exchangeRate.findFirst({
      where: {
        currency: 'USD',
        date: {
          gte: today
        }
      }
    })

    if (!existingRate) {
      await prisma.exchangeRate.create({
        data: {
          currency: 'USD',
          rate: usdRate,
          source,
          date: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      rate: usdRate,
      lastUpdate,
      source
    })

  } catch (error) {
    console.error('Error getting BCV rate:', error)

    // IMPORTANTE: Devolver success: true con fallback para que el frontend lo muestre
    return NextResponse.json({
      success: true,
      error: 'No se pudo obtener la tasa en tiempo real',
      rate: 53.50, // Tasa aproximada como fallback
      lastUpdate: new Date().toISOString(),
      source: 'HARDCODED_FALLBACK'
    })
  }
}

