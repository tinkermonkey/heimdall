import { useEffect, useRef, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  const queryRef = useRef(query)
  const queryListRef = useRef<MediaQueryList | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // If query changed, update the ref and recreate the MediaQueryList
    if (queryRef.current !== query) {
      queryRef.current = query
      queryListRef.current = null
    }

    // Memoize the MediaQueryList instance
    if (!queryListRef.current) {
      queryListRef.current = window.matchMedia(query)
    }

    // Set initial state
    setMatches(queryListRef.current.matches)

    // Subscribe to changes
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches)
    }

    const mediaQueryList = queryListRef.current
    mediaQueryList.addEventListener('change', handleChange)

    return () => {
      mediaQueryList.removeEventListener('change', handleChange)
    }
  }, [query])

  return matches
}
