import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
})

const outfit = Outfit({
    subsets: ['latin'],
    variable: '--font-outfit',
    display: 'swap',
})

export const metadata: Metadata = {
    title: 'NOVA-ADM | Sistema Administrativo',
    description: 'Sistema administrativo y contable integral para empresas venezolanas',
    keywords: ['contabilidad', 'venezuela', 'seniat', 'facturación', 'retenciones'],
    authors: [{ name: 'NOVA-ADM' }],
    themeColor: '#f97316',
    manifest: '/manifest.json',
    viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 1,
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="es" className={`${inter.variable} ${outfit.variable}`}>
            <body className={inter.className}>
                {children}
            </body>
        </html>
    )
}
