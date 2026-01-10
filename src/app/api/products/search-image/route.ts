import { NextRequest, NextResponse } from 'next/server'

// Search for product images using reference code (e.g., 90311-35001)
// Uses a proxy approach to avoid CORS issues with image searches

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const reference = searchParams.get('reference')

        if (!reference) {
            return NextResponse.json(
                { error: 'Reference code is required' },
                { status: 400 }
            )
        }

        // Clean the reference code
        const cleanRef = reference.trim()

        // Build search queries - Toyota parts specific
        const searchQueries = [
            `${cleanRef} Toyota part`,
            `${cleanRef} OEM Toyota`,
            `${cleanRef} genuine Toyota`,
        ]

        // Use multiple sources to find images
        const images: { url: string; source: string; thumbnail?: string }[] = []

        // Try to fetch from Toyota parts catalogs and image sources
        // We'll use a combination of approaches:

        // 1. Direct catalog image URLs (common patterns)
        const catalogUrls = [
            `https://parts.toyota.com/images/${cleanRef.replace('-', '_')}.jpg`,
            `https://www.toyotapartsdeal.com/media/catalog/product/${cleanRef.charAt(0)}/${cleanRef.charAt(1)}/${cleanRef}.jpg`,
        ]

        for (const url of catalogUrls) {
            images.push({
                url: url,
                source: 'Toyota Catalog',
                thumbnail: url,
            })
        }

        // 2. Generate Google Images search URL for manual reference
        const googleSearchUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(cleanRef + ' Toyota part')}`

        // 3. Try partsouq.com which has many Toyota parts images
        const partsouqUrl = `https://partsouq.com/api/search/image?q=${encodeURIComponent(cleanRef)}`
        images.push({
            url: `https://partsouq.com/images/parts/toyota/${cleanRef.replace('-', '/')}.jpg`,
            source: 'PartsOuq',
        })

        // 4. Megazip parts images
        images.push({
            url: `https://images.megazip.net/parts/toyota/${cleanRef.toLowerCase()}.png`,
            source: 'Megazip',
        })

        // 5. AmayamaStore parts images
        images.push({
            url: `https://amayama.com/catalog/toyota/part/${cleanRef}/image.jpg`,
            source: 'Amayama',
        })

        return NextResponse.json({
            success: true,
            reference: cleanRef,
            images: images,
            googleSearchUrl: googleSearchUrl,
            message: 'Selecciona una imagen o usa la búsqueda de Google',
        })
    } catch (error) {
        console.error('Error searching for images:', error)
        return NextResponse.json(
            { error: 'Error al buscar imágenes' },
            { status: 500 }
        )
    }
}

// POST endpoint to validate if an image URL is accessible
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { imageUrl } = body

        if (!imageUrl) {
            return NextResponse.json(
                { error: 'Image URL is required' },
                { status: 400 }
            )
        }

        // Try to fetch the image to check if it exists
        const response = await fetch(imageUrl, {
            method: 'HEAD',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        })

        const isValid = response.ok && response.headers.get('content-type')?.startsWith('image/')

        return NextResponse.json({
            success: true,
            isValid,
            contentType: response.headers.get('content-type'),
            status: response.status,
        })
    } catch (error) {
        console.error('Error validating image:', error)
        return NextResponse.json({
            success: true,
            isValid: false,
            error: 'Could not validate image',
        })
    }
}
