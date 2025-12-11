import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'VES',
        minimumFractionDigits: 2,
    }).format(amount)
}

export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('es-VE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(d)
}

export function formatShortDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('es-VE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(d)
}

export function validateRIF(rif: string): boolean {
    // Venezuelan RIF format: J-12345678-9 or V-12345678-9
    const rifRegex = /^[VJEGPCDF]-\d{8,9}-\d$/
    return rifRegex.test(rif)
}

export function calculateIVA(amount: number, rate: number = 16): number {
    return amount * (rate / 100)
}

export function calculateTotal(subtotal: number, ivaRate: number = 16): number {
    return subtotal + calculateIVA(subtotal, ivaRate)
}

export function calculateIVAWithholding(taxAmount: number, withholdingRate: number = 75): number {
    // Venezuelan IVA withholding is typically 75% or 100% of the tax
    return taxAmount * (withholdingRate / 100)
}
