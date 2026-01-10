import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Generate a simple HTML receipt/quote that can be printed as PDF
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const sale = await prisma.sale.findUnique({
            where: { id },
            include: {
                customer: true,
                user: true,
                items: {
                    include: {
                        product: true
                    }
                },
                company: true
            }
        })

        if (!sale) {
            return NextResponse.json(
                { error: 'Documento no encontrado' },
                { status: 404 }
            )
        }

        const formatCurrency = (value: number) => value.toFixed(2)
        const formatDate = (date: Date) => new Date(date).toLocaleDateString('es-VE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })

        const documentTitle = sale.documentType === 'QUOTE' ? 'PRESUPUESTO' : 'PEDIDO'
        const documentColor = sale.documentType === 'QUOTE' ? '#EAB308' : '#3B82F6'

        const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${documentTitle} ${sale.saleNumber}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: Arial, sans-serif; 
            padding: 40px; 
            max-width: 800px; 
            margin: 0 auto;
            color: #333;
        }
        .header { 
            border-bottom: 3px solid ${documentColor}; 
            padding-bottom: 20px; 
            margin-bottom: 30px;
        }
        .header h1 { 
            color: ${documentColor}; 
            font-size: 28px;
            margin-bottom: 5px;
        }
        .header .number { 
            font-size: 18px; 
            color: #666;
        }
        .company-info {
            text-align: right;
            font-size: 12px;
            color: #666;
        }
        .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px;
            margin-bottom: 30px;
        }
        .info-box { 
            background: #f9f9f9; 
            padding: 15px; 
            border-radius: 8px;
        }
        .info-box h3 { 
            font-size: 12px; 
            color: #666; 
            margin-bottom: 5px;
            text-transform: uppercase;
        }
        .info-box p { 
            font-size: 14px; 
            font-weight: bold;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 30px;
        }
        th { 
            background: #333; 
            color: white; 
            padding: 12px; 
            text-align: left;
            font-size: 12px;
            text-transform: uppercase;
        }
        td { 
            padding: 12px; 
            border-bottom: 1px solid #eee;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .totals { 
            float: right; 
            width: 300px;
            background: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
        }
        .totals .row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 8px;
        }
        .totals .total { 
            font-size: 20px; 
            font-weight: bold; 
            color: ${documentColor};
            border-top: 2px solid #333;
            padding-top: 10px;
            margin-top: 10px;
        }
        .footer {
            clear: both;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #666;
            text-align: center;
        }
        .warning {
            background: #FEF3C7;
            border: 1px solid #F59E0B;
            color: #92400E;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            text-align: center;
            font-weight: bold;
        }
        @media print {
            body { padding: 20px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
                <h1>${documentTitle}</h1>
                <p class="number">${sale.saleNumber}</p>
            </div>
            <div class="company-info">
                <strong>${sale.company?.name || 'NOVA'}</strong><br>
                ${sale.company?.rif || ''}<br>
                ${formatDate(sale.createdAt)}
            </div>
        </div>
    </div>

    <div class="info-grid">
        <div class="info-box">
            <h3>Cliente</h3>
            <p>${sale.customer?.name || 'Consumidor Final'}</p>
            <p style="font-weight: normal; font-size: 12px; color: #666;">${sale.customer?.rif || ''}</p>
        </div>
        <div class="info-box">
            <h3>Vendedor</h3>
            <p>${sale.user?.name || 'Sistema'}</p>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Producto</th>
                <th class="text-center">Cant.</th>
                <th class="text-right">Precio USD</th>
                <th class="text-right">Total USD</th>
            </tr>
        </thead>
        <tbody>
            ${sale.items.map(item => `
                <tr>
                    <td>${item.description}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">$${formatCurrency(item.unitPriceUSD)}</td>
                    <td class="text-right">$${formatCurrency(item.totalUSD)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="totals">
        <div class="row">
            <span>Subtotal:</span>
            <span>$${formatCurrency(sale.subtotalUSD)}</span>
        </div>
        <div class="row">
            <span>IVA (16%):</span>
            <span>$${formatCurrency(sale.taxAmountUSD)}</span>
        </div>
        <div class="row total">
            <span>TOTAL:</span>
            <span>$${formatCurrency(sale.totalUSD)}</span>
        </div>
        <div class="row" style="font-size: 12px; color: #666;">
            <span>En Bs:</span>
            <span>Bs. ${formatCurrency(sale.totalBS)}</span>
        </div>
    </div>

    ${sale.documentType === 'QUOTE' ? `
        <div class="warning" style="clear: both;">
            ⚠️ Este presupuesto es válido únicamente el día de hoy
        </div>
    ` : ''}

    <div class="footer">
        <p>Documento generado el ${formatDate(new Date())} | Tasa BCV: Bs. ${formatCurrency(sale.bcvRate)} / USD</p>
    </div>

    <script>
        // Auto-print when opened
        window.onload = function() {
            window.print();
        }
    </script>
</body>
</html>
        `

        return new NextResponse(html, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
            }
        })
    } catch (error) {
        console.error('Error generating PDF:', error)
        return NextResponse.json(
            { error: 'Error al generar documento' },
            { status: 500 }
        )
    }
}
