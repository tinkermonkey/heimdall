import { useEffect, useRef, useState } from 'react'

interface UseVirtualListOptions {
  itemCount: number
  itemHeight: number
  containerHeight: number
  overscan?: number
}

interface UseVirtualListReturn {
  visibleRange: [number, number]
  containerRef: React.RefObject<HTMLDivElement>
}

export const useVirtualList = ({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 5,
}: UseVirtualListOptions): UseVirtualListReturn => {
  const containerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [visibleRange, setVisibleRange] = useState<[number, number]>([0, Math.ceil(containerHeight / itemHeight)])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const calculateVisibleRange = () => {
      const sentinel = sentinelRef.current
      if (!sentinel) return

      const sentinelRect = sentinel.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()

      const scrollTop = sentinelRect.top - containerRect.top

      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
      const endIndex = Math.min(itemCount, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan)

      setVisibleRange([startIndex, endIndex])
    }

    let sentinel = sentinelRef.current
    if (!sentinel) {
      sentinel = document.createElement('div')
      sentinel.style.height = '0px'
      sentinel.style.pointerEvents = 'none'
      container.insertBefore(sentinel, container.firstChild)
      sentinelRef.current = sentinel
    }

    observerRef.current = new IntersectionObserver(calculateVisibleRange, {
      root: container,
      threshold: [0, 0.25, 0.5, 0.75, 1],
    })

    observerRef.current.observe(sentinel)

    calculateVisibleRange()

    return () => {
      observerRef.current?.disconnect()
      if (sentinelRef.current?.parentNode) {
        sentinelRef.current.parentNode.removeChild(sentinelRef.current)
      }
      sentinelRef.current = null
    }
  }, [itemCount, itemHeight, containerHeight, overscan])

  return {
    visibleRange,
    containerRef,
  }
}
