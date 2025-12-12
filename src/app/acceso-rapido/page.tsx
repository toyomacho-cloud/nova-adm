'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function QuickAccessPage() {
    const router = useRouter()

    useEffect(() => {
        // Simulate session storage
        localStorage.setItem('temp-user', JSON.stringify({
            id: 'temp-user-id',
            name: 'LUIS A RIVAS',
            email: 'luisar2ro@gmail.com',
            company: 'TOYOMACHO C.A.',
            role: 'ADMIN'
        }))

        // Redirect to dashboard
        setTimeout(() => {
            router.push('/dashboard')
        }, 500)
    }, [router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500/10 to-secondary-500/10">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 mb-4 animate-pulse">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    Acceso Temporal Activado
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Redirigiendo al Dashboard...
                </p>
            </div>
        </div>
    )
}
