import React from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass' | 'interactive'
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', ...props }, ref) => {
        const variants = {
            default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-soft',
            glass: 'glass-card',
            interactive: 'card-interactive',
        }

        return (
            <div
                ref={ref}
                className={cn('rounded-xl p-6', variants[variant], className)}
                {...props}
            />
        )
    }
)

Card.displayName = 'Card'

export { Card }
