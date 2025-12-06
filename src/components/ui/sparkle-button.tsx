// src/components/ui/sparkle-button.tsx

'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'

interface SparkleButtonProps {
  onClick: () => void
  isLoading: boolean
  disabled?: boolean
  className?: string
}

export function SparkleButton({ onClick, isLoading, disabled, className }: SparkleButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-lg',
        'bg-white/[0.06] hover:bg-white/[0.12]',
        'border border-white/[0.08] hover:border-white/[0.16]',
        'text-zinc-400 hover:text-zinc-200',
        'transition-all duration-200',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/[0.06]',
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title="Polish with AI"
    >
      {isLoading ? (
        <motion.div
          className="h-3.5 w-3.5 rounded-full border-2 border-zinc-600 border-t-zinc-300"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
      ) : (
        <motion.div
          animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatDelay: 3,
          }}
        >
          <Sparkles className="h-3.5 w-3.5" />
        </motion.div>
      )}
    </motion.button>
  )
}
