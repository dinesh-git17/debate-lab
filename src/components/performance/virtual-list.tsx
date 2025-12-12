// src/components/performance/virtual-list.tsx
/**
 * Virtualized list component for efficient rendering of large datasets.
 * Supports variable item heights, sticky scroll behavior, and infinite loading.
 */

'use client'

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
  type CSSProperties,
} from 'react'

interface VirtualListProps<T> {
  items: T[]
  itemHeight: number | ((index: number, item: T) => number)
  renderItem: (item: T, index: number, style: CSSProperties) => ReactNode
  overscan?: number
  className?: string
  onEndReached?: () => void
  endReachedThreshold?: number
  initialScrollToEnd?: boolean
  stickyToEnd?: boolean
}

interface VirtualItem {
  index: number
  start: number
  end: number
  size: number
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  overscan = 3,
  className = '',
  onEndReached,
  endReachedThreshold = 100,
  initialScrollToEnd = false,
  stickyToEnd = false,
}: VirtualListProps<T>): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const isUserScrolling = useRef(false)
  const wasAtEnd = useRef(false)

  const getItemHeight = useCallback(
    (index: number): number => {
      if (typeof itemHeight === 'function') {
        const item = items[index]
        if (item === undefined) return 0
        return itemHeight(index, item)
      }
      return itemHeight
    },
    [itemHeight, items]
  )

  const { totalHeight, itemMetadata } = useMemo(() => {
    const metadata: VirtualItem[] = []
    let offset = 0

    for (let i = 0; i < items.length; i++) {
      const size = getItemHeight(i)
      metadata.push({
        index: i,
        start: offset,
        end: offset + size,
        size,
      })
      offset += size
    }

    return { totalHeight: offset, itemMetadata: metadata }
  }, [items, getItemHeight])

  const visibleRange = useMemo(() => {
    if (itemMetadata.length === 0) {
      return { start: 0, end: 0 }
    }

    const scrollBottom = scrollTop + containerHeight

    let start = 0
    let end = itemMetadata.length - 1

    for (let i = 0; i < itemMetadata.length; i++) {
      const item = itemMetadata[i]
      if (item && item.end > scrollTop) {
        start = Math.max(0, i - overscan)
        break
      }
    }

    for (let i = start; i < itemMetadata.length; i++) {
      const item = itemMetadata[i]
      if (item && item.start > scrollBottom) {
        end = Math.min(itemMetadata.length - 1, i + overscan)
        break
      }
    }

    return { start, end }
  }, [scrollTop, containerHeight, itemMetadata, overscan])

  const visibleItems = useMemo(() => {
    const result: Array<{ item: T; index: number; style: CSSProperties }> = []

    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      const meta = itemMetadata[i]
      const item = items[i]
      if (meta && item !== undefined) {
        result.push({
          item,
          index: i,
          style: {
            position: 'absolute',
            top: meta.start,
            left: 0,
            right: 0,
            height: meta.size,
          },
        })
      }
    }

    return result
  }, [visibleRange, itemMetadata, items])

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget
      setScrollTop(target.scrollTop)

      const distanceFromEnd = totalHeight - (target.scrollTop + target.clientHeight)
      wasAtEnd.current = distanceFromEnd < 50

      if (distanceFromEnd < endReachedThreshold && onEndReached) {
        onEndReached()
      }
    },
    [totalHeight, endReachedThreshold, onEndReached]
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height)
      }
    })

    resizeObserver.observe(container)
    setContainerHeight(container.clientHeight)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    if (initialScrollToEnd && items.length > 0) {
      container.scrollTop = totalHeight
    }
  }, [initialScrollToEnd, items.length, totalHeight])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !stickyToEnd) return

    if (wasAtEnd.current && !isUserScrolling.current) {
      container.scrollTop = totalHeight
    }
  }, [items.length, totalHeight, stickyToEnd])

  const handleScrollStart = useCallback(() => {
    isUserScrolling.current = true
  }, [])

  const handleScrollEnd = useCallback(() => {
    isUserScrolling.current = false
  }, [])

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      onScroll={handleScroll}
      onMouseDown={handleScrollStart}
      onMouseUp={handleScrollEnd}
      onTouchStart={handleScrollStart}
      onTouchEnd={handleScrollEnd}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        {visibleItems.map(({ item, index, style }) => renderItem(item, index, style))}
      </div>
    </div>
  )
}

export function useVirtualScrollToEnd(
  containerRef: React.RefObject<HTMLDivElement | null>,
  itemCount: number,
  enabled = true
): void {
  const prevItemCount = useRef(itemCount)

  useEffect(() => {
    const container = containerRef.current
    if (!container || !enabled) return

    if (itemCount > prevItemCount.current) {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight
      })
    }

    prevItemCount.current = itemCount
  }, [containerRef, itemCount, enabled])
}
