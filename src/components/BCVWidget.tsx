'use client'

import { useEffect, useState } from 'react'
import { DollarSign, RefreshCw } from 'lucide-react'

export function BCVWidget() {
    const [rate, setRate] = useState<number | null>(null)
    const [lastUpdate, setLastUpdate] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [source, setSource] = useState('')

    const fetchRate = async () => {
        try {
            const res = await fetch('/api/bcv/rate')
            const data = await res.json()

            if (data.success) {
                setRate(data.rate)
                setLastUpdate(new Date(data.lastUpdate).toLocaleTimeString('es-VE', {
                    hour: '2-digit',
                    minute: '2-digit'
                }))
                setSource(data.source)
            }
        } catch (error) {
            console.error('Error fetching BCV rate:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRate()
        // Actualizar cada hora
        const interval = setInterval(fetchRate, 3600000)
        return () => clearInterval(interval)
    }, [])

    if (loading || !rate) {
        return (
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg animate-pulse">
                <div className="h-16 bg-white/20 rounded"></div>
            </div>
        )
    }

    return (
        <div className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 rounded-xl p-5 text-white shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[url('/grid.svg')]"></div>
            </div>

            {/* Content */}
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <DollarSign className="w-6 h-6" />
                        <span className="text-sm font-bold tracking-wide">TASA BCV</span>
                    </div>
                    <button
                        onClick={fetchRate}
                        className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                        title="Actualizar"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex flex-col gap-1 mb-3">
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold">
                            Bs. {rate.toFixed(2)}
                        </span>
                    </div>
                    <span className="text-lg opacity-90">por cada USD</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                    <span className="opacity-75">
                        Actualizada: Hoy {lastUpdate}
                    </span>
                    {source === 'DB_CACHE' && (
                        <span className="bg-yellow-400/30 px-2 py-0.5 rounded text-xs">
                            Caché
                        </span>
                    )}
                </div>
            </div>

            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-1000"></div>
        </div>
    )
}
