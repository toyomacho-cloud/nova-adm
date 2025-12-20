import { ReactNode } from 'react'

// Force dynamic rendering for all auth pages
export const dynamic = 'force-dynamic'

export default function AuthLayout({ children }: { children: ReactNode }) {
    return <>{children}</>
}
