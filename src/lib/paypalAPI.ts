// PayPal SDK Integration for Venezuela

interface PayPalConfig {
    clientId: string
    clientSecret: string
    environment: 'sandbox' | 'production'
}

interface PayPalPayment {
    amount: number
    currency: 'USD' | 'VES'
    description: string
    reference: string
    returnUrl: string
    cancelUrl: string
}

interface PayPalResponse {
    success: boolean
    orderId: string
    approvalUrl: string
    captureUrl: string
}

export class PayPalAPI {
    private config: PayPalConfig
    private baseUrl: string

    constructor(config: PayPalConfig) {
        this.config = config
        this.baseUrl = config.environment === 'production'
            ? 'https://api.paypal.com'
            : 'https://api.sandbox.paypal.com'
    }

    private async getAccessToken(): Promise<string> {
        const auth = Buffer.from(
            `${this.config.clientId}:${this.config.clientSecret}`
        ).toString('base64')

        const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
        })

        const data = await response.json()
        return data.access_token
    }

    async createOrder(payment: PayPalPayment): Promise<PayPalResponse> {
        try {
            const accessToken = await this.getAccessToken()

            const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    intent: 'CAPTURE',
                    purchase_units: [
                        {
                            reference_id: payment.reference,
                            description: payment.description,
                            amount: {
                                currency_code: payment.currency,
                                value: payment.amount.toFixed(2),
                            },
                        },
                    ],
                    application_context: {
                        return_url: payment.returnUrl,
                        cancel_url: payment.cancelUrl,
                        brand_name: 'NOVA Store',
                        landing_page: 'BILLING',
                        user_action: 'PAY_NOW',
                    },
                }),
            })

            const data = await response.json()

            if (data.id) {
                const approvalUrl = data.links.find((l: any) => l.rel === 'approve')?.href || ''

                return {
                    success: true,
                    orderId: data.id,
                    approvalUrl,
                    captureUrl: '',
                }
            }

            throw new Error('PayPal order creation failed')
        } catch (error) {
            console.error('PayPal error:', error)
            throw error
        }
    }

    async captureOrder(orderId: string): Promise<any> {
        try {
            const accessToken = await this.getAccessToken()

            const response = await fetch(
                `${this.baseUrl}/v2/checkout/orders/${orderId}/capture`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            )

            return await response.json()
        } catch (error) {
            console.error('PayPal capture error:', error)
            throw error
        }
    }
}

// Export singleton
let paypalInstance: PayPalAPI | null = null

export function getPayPalAPI(): PayPalAPI {
    if (!paypalInstance) {
        paypalInstance = new PayPalAPI({
            clientId: process.env.PAYPAL_CLIENT_ID || '',
            clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
            environment: (process.env.PAYPAL_ENV as 'sandbox' | 'production') || 'sandbox',
        })
    }
    return paypalInstance
}
