import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// This API is called by Vercel Cron at midnight (Venezuela time = 4am UTC)
// It deletes all QUOTE documents with PENDING status that were created before today

export async function GET(req: NextRequest) {
    try {
        // Verify cron secret for security
        const authHeader = req.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get start of today (midnight)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Delete expired quotes (QUOTE documents with PENDING status created before today)
        const result = await prisma.sale.deleteMany({
            where: {
                documentType: 'QUOTE',
                paymentStatus: 'PENDING',
                createdAt: {
                    lt: today
                }
            }
        })

        console.log(`[CRON] Deleted ${result.count} expired quotes`)

        return NextResponse.json({
            success: true,
            message: `Deleted ${result.count} expired quotes`,
            deletedCount: result.count,
            executedAt: new Date().toISOString()
        })
    } catch (error) {
        console.error('[CRON] Error cleaning up quotes:', error)
        return NextResponse.json(
            { error: 'Failed to clean up quotes' },
            { status: 500 }
        )
    }
}
