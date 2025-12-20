// Cashea API Integration for Venezuela
// Based on standard payment gateway patterns

interface CasheaConfig {
    apiKey: string
    apiSecret: string
    merchantId: string
    environment: 'sandbox' | 'production'
}

interface PaymentRequest {
    amount: number
    currency: 'USD' | 'VES'
    description: string
    reference: string
    customerEmail?: string
    customerPhone?: string
    callbackUrl: string
    returnUrl: string
}

interface PaymentResponse {
    success: boolean
    paymentId: string
    paymentUrl: string
    qrCode: string
    reference: string
    status: 'pending' | 'approved' | 'rejected' | 'expired'
    expiresAt: string
}

interface WebhookPayload {
    event: 'payment.approved' | 'payment.rejected' | 'payment.expired'
    paymentId: string
    reference: string
    amount: number
    currency: string
    commission: number
    netAmount: number
    paidAt: string
    customData?: any
}

export class CasheaAPI {
    private config: CasheaConfig
    private baseUrl: string

    constructor(config: CasheaConfig) {
        this.config = config
        this.baseUrl = config.environment === 'production'
            ? 'https://api.cashea.com.ve/v1'
            : 'https://sandbox.cashea.com.ve/v1'
    }

    private async request(endpoint: string, method: string = 'GET', body?: any) {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
            'X-Merchant-ID': this.config.merchantId,
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        })

        if (!response.ok) {
            throw new Error(`Cashea API Error: ${response.statusText}`)
        }

        return response.json()
    }

    async createPayment(data: PaymentRequest): Promise<PaymentResponse> {
        try {
            const response = await this.request('/payments', 'POST', {
                merchant_id: this.config.merchantId,
                amount: data.amount,
                currency: data.currency,
                description: data.description,
                reference: data.reference,
                customer: {
                    email: data.customerEmail,
                    phone: data.customerPhone,
                },
                callback_url: data.callbackUrl,
                return_url: data.returnUrl,
            })

            return {
                success: true,
                paymentId: response.payment_id,
                paymentUrl: response.payment_url,
                qrCode: response.qr_code,
                reference: response.reference,
                status: 'pending',
                expiresAt: response.expires_at,
            }
        } catch (error) {
            console.error('Cashea payment creation error:', error)
            throw error
        }
    }

    async getPaymentStatus(paymentId: string) {
        try {
            const response = await this.request(`/payments/${paymentId}`)
            return {
                paymentId: response.payment_id,
                status: response.status,
                amount: response.amount,
                commission: response.commission,
                netAmount: response.net_amount,
                paidAt: response.paid_at,
            }
        } catch (error) {
            console.error('Cashea status check error:', error)
            throw error
        }
    }

    async getTransactions(startDate?: Date, endDate?: Date) {
        try {
            const params = new URLSearchParams()
            if (startDate) params.append('start_date', startDate.toISOString())
            if (endDate) params.append('end_date', endDate.toISOString())

            const response = await this.request(`/transactions?${params.toString()}`)
            return response.transactions
        } catch (error) {
            console.error('Cashea transactions error:', error)
            throw error
        }
    }

    verifyWebhookSignature(payload: string, signature: string): boolean {
        // Implement signature verification
        // This would use HMAC-SHA256 with the API secret
        const crypto = require('crypto')
        const expectedSignature = crypto
            .createHmac('sha256', this.config.apiSecret)
            .update(payload)
            .digest('hex')

        return expectedSignature === signature
    }
}

// Export singleton instance
let casheaInstance: CasheaAPI | null = null

export function getCasheaAPI(): CasheaAPI {
    if (!casheaInstance) {
        casheaInstance = new CasheaAPI({
            apiKey: process.env.CASHEA_API_KEY || '',
            apiSecret: process.env.CASHEA_API_SECRET || '',
            merchantId: process.env.CASHEA_MERCHANT_ID || '',
            environment: (process.env.CASHEA_ENV as 'sandbox' | 'production') || 'sandbox',
        })
    }
    return casheaInstance
}
