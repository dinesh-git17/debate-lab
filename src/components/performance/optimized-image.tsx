// src/components/performance/optimized-image.tsx
// Wrapper around next/image with performance optimizations

import Image from 'next/image'
import React from 'react'

import {
  getImageSizes,
  getImagePriority,
  generateBlurDataUrl,
  buildSizesAttribute,
  type ResponsiveImageSizes,
} from '@/lib/performance'

type ImagePreset = 'hero' | 'card' | 'avatar' | 'thumbnail' | 'icon'

interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  preset?: ImagePreset
  sizes?: ResponsiveImageSizes | string
  isAboveFold?: boolean
  isLCP?: boolean
  showPlaceholder?: boolean
  className?: string
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  preset,
  sizes,
  isAboveFold = false,
  isLCP = false,
  showPlaceholder = true,
  className,
}: OptimizedImageProps): React.ReactElement {
  const computedSizes =
    typeof sizes === 'string'
      ? sizes
      : preset
        ? getImageSizes(preset)
        : sizes
          ? buildSizesAttribute(sizes)
          : undefined

  const { priority, loading } = getImagePriority(isAboveFold, isLCP)

  const placeholderProps = showPlaceholder
    ? {
        placeholder: 'blur' as const,
        blurDataURL: generateBlurDataUrl(width, height),
      }
    : {}

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={computedSizes}
      priority={priority}
      loading={loading}
      className={className}
      {...placeholderProps}
    />
  )
}

interface ResponsiveImageProps extends OptimizedImageProps {
  mobileSrc?: string
  tabletSrc?: string
  desktopSrc?: string
}

export function ResponsiveImage({
  mobileSrc,
  tabletSrc,
  desktopSrc,
  src,
  alt,
  width,
  height,
  ...props
}: ResponsiveImageProps): React.ReactElement {
  const sources = [
    { media: '(min-width: 1024px)', srcSet: desktopSrc },
    { media: '(min-width: 768px)', srcSet: tabletSrc },
    { media: '(max-width: 767px)', srcSet: mobileSrc },
  ].filter((s) => s.srcSet)

  if (sources.length === 0) {
    return <OptimizedImage src={src} alt={alt} width={width} height={height} {...props} />
  }

  return (
    <picture>
      {sources.map((source, index) => (
        <source key={index} media={source.media} srcSet={source.srcSet} />
      ))}
      <OptimizedImage src={src} alt={alt} width={width} height={height} {...props} />
    </picture>
  )
}
