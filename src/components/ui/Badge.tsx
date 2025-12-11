import React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant = 'default', ...props }, ref) => {
        const variants = {
            default: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
            success: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400',
            warning: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400',
            danger: 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400',
            info: 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-400',
        }

        return (
            <span
                ref={ref}
                className={cn('badge', variants[variant], className)}
                {...props}
            />
        )
    }
)

Badge.displayName = 'Badge'

export { Badge }
