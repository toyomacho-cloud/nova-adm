import { NextRequest, NextResponse } from 'next/server'

// GET /api/rates/binance - Get Binance P2P USDT/VES rate
export async function GET(req: NextRequest) {
    try {
        // Fetch from Binance P2P API
        const response = await fetch('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                asset: 'USDT',
                fiat: 'VES',
                tradeType: 'SELL', // We want to see rates for selling USDT (buying VES)
                page: 1,
                rows: 10,
                publisherType: 'merchant', // Only verified merchants
            }),
            // Cache for 5 minutes
            next: { revalidate: 300 },
        })

        if (!response.ok) {
            throw new Error('Failed to fetch Binance rate')
        }

        const data = await response.json()

        if (!data.success || !data.data || data.data.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'No Binance P2P data available',
            }, { status: 500 })
        }

        // Extract prices from top merchants
        const prices = data.data.map((item: any) => parseFloat(item.adv.price))

        // Calculate average of top 5
        const topPrices = prices.slice(0, 5)
        const average = topPrices.reduce((a: number, b: number) => a + b, 0) / topPrices.length

        // Get min and max for reference
        const min = Math.min(...prices)
        const max = Math.max(...prices)

        return NextResponse.json({
            success: true,
            rate: parseFloat(average.toFixed(2)),
            min: parseFloat(min.toFixed(2)),
            max: parseFloat(max.toFixed(2)),
            source: 'Binance P2P',
            currency: 'USDT/VES',
            timestamp: new Date().toISOString(),
            merchantCount: data.data.length,
        })
    } catch (error) {
        console.error('Error fetching Binance rate:', error)
        return NextResponse.json({
            success: false,
            error: 'Error fetching Binance rate',
        }, { status: 500 })
    }
}
