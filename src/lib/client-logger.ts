// src/lib/client-logger.ts
// Lightweight browser-compatible logger for client components
/* eslint-disable no-console */

const isDev = process.env.NODE_ENV === 'development'

type LogContext = Record<string, unknown>

export const clientLogger = {
  debug(message: string, context?: LogContext): void {
    if (isDev) {
      console.debug(`[DEBUG] ${message}`, context ?? '')
    }
  },

  info(message: string, context?: LogContext): void {
    if (isDev) {
      console.info(`[INFO] ${message}`, context ?? '')
    }
  },

  warn(message: string, context?: LogContext): void {
    if (isDev) {
      console.warn(`[WARN] ${message}`, context ?? '')
    }
  },

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (isDev) {
      console.error(`[ERROR] ${message}`, error ?? '', context ?? '')
    }
    // In production, errors could be sent to an error tracking service
    // This is handled by the error boundary and Sentry integration
  },
}
