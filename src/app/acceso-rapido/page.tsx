'use client'

export default function QuickAccessPage() {
    if (typeof window !== 'undefined') {
        // Redirect immediately
        window.location.href = '/dashboard'
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
            <div style={{
                textAlign: 'center',
                color: 'white'
            }}>
                <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>
                    Redirigiendo al Dashboard...
                </h1>
                <p>Un momento por favor</p>
            </div>
        </div>
    )
}

