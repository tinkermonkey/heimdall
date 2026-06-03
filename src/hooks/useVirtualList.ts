import { useEffect, useRef, useState } from 'react'

interface UseVirtualListOptions {
  itemCount: number
  itemHeight: number
  containerHeight: number
  overscan?: number
}

interface UseVirtualListReturn {
  visibleRange: [number, number]
  offsetY: number
  containerRef: React.RefObject<HTMLDivElement>
}

export const useVirtualList = ({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 5,
}: UseVirtualListOptions): UseVirtualListReturn => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [offsetY, setOffsetY] = useState(0)
  const [visibleRange, setVisibleRange] = useState<[number, number]>([0, Math.ceil(containerHeight / itemHeight)])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollTop = container.scrollTop
      setOffsetY(scrollTop)

      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
      const endIndex = Math.min(itemCount, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan)

      setVisibleRange([startIndex, endIndex])
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [itemCount, itemHeight, containerHeight, overscan])

  return {
    visibleRange,
    offsetY,
    containerRef,
  }
}
