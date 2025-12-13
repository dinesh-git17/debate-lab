// image-config.ts
/**
 * Image optimization configuration for next/image.
 * Defines responsive sizes, blur placeholders, and loading priority strategies.
 */

import type { ImageOptimizationConfig } from '@/types/performance'

export const IMAGE_CONFIG: ImageOptimizationConfig = {
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  formats: ['image/avif', 'image/webp'],
  minimumCacheTTL: 60 * 60 * 24 * 30,
  dangerouslyAllowSVG: false,
}

export const REMOTE_PATTERNS = [
  {
    protocol: 'https' as const,
    hostname: '**.vercel.app',
  },
  {
    protocol: 'https' as const,
    hostname: 'avatars.githubusercontent.com',
  },
] as const

export interface ResponsiveImageSizes {
  default: string
  sm?: string
  md?: string
  lg?: string
  xl?: string
}

export const COMMON_IMAGE_SIZES: Record<string, ResponsiveImageSizes> = {
  hero: {
    default: '100vw',
    lg: '80vw',
    xl: '1200px',
  },
  card: {
    default: '100vw',
    sm: '50vw',
    md: '33vw',
    lg: '25vw',
  },
  avatar: {
    default: '48px',
  },
  thumbnail: {
    default: '100vw',
    sm: '200px',
  },
  icon: {
    default: '24px',
  },
}

export function buildSizesAttribute(config: ResponsiveImageSizes): string {
  const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  }

  const parts: string[] = []

  if (config.xl) {
    parts.push(`(min-width: ${breakpoints.xl}px) ${config.xl}`)
  }
  if (config.lg) {
    parts.push(`(min-width: ${breakpoints.lg}px) ${config.lg}`)
  }
  if (config.md) {
    parts.push(`(min-width: ${breakpoints.md}px) ${config.md}`)
  }
  if (config.sm) {
    parts.push(`(min-width: ${breakpoints.sm}px) ${config.sm}`)
  }

  parts.push(config.default)

  return parts.join(', ')
}

export function getImageSizes(preset: keyof typeof COMMON_IMAGE_SIZES): string {
  const config = COMMON_IMAGE_SIZES[preset]
  if (!config) return '100vw'
  return buildSizesAttribute(config)
}

export interface BlurPlaceholderConfig {
  enabled: boolean
  size: number
  quality: number
}

export const BLUR_PLACEHOLDER_CONFIG: BlurPlaceholderConfig = {
  enabled: true,
  size: 10,
  quality: 30,
}

export function generateBlurDataUrl(width: number, height: number): string {
  const shimmer = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g">
          <stop stop-color="#f6f7f8" offset="0%" />
          <stop stop-color="#edeef1" offset="50%" />
          <stop stop-color="#f6f7f8" offset="100%" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#g)" />
    </svg>
  `

  return `data:image/svg+xml;base64,${Buffer.from(shimmer).toString('base64')}`
}

export type ImagePriority = 'high' | 'low' | 'auto'

export function getImagePriority(
  isAboveFold: boolean,
  isLCP: boolean
): { priority: boolean; loading: 'eager' | 'lazy' } {
  if (isLCP) {
    return { priority: true, loading: 'eager' }
  }

  if (isAboveFold) {
    return { priority: false, loading: 'eager' }
  }

  return { priority: false, loading: 'lazy' }
}
