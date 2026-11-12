import { useCallback, useSyncExternalStore } from 'react'

const canMatchMedia = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'

const getServerSnapshot = () => undefined

/**
 * Whether `query` matches, or `undefined` while it can't be known: during server rendering and
 * while React hydrates server HTML. Components use the `undefined` state to leave layout to their
 * CSS `@media` rules until the client takes over, so hydration never sees different markup.
 */
export function useMediaQueryMatch(query: string): boolean | undefined {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!canMatchMedia()) return () => {}
      const mediaQueryList = window.matchMedia(query)
      mediaQueryList.addEventListener('change', onChange)
      return () => mediaQueryList.removeEventListener('change', onChange)
    },
    [query]
  )
  const getSnapshot = () => (canMatchMedia() ? window.matchMedia(query).matches : undefined)
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/**
 * Whether `query` matches. Server rendering and hydration see `serverValue` (default `false`),
 * then the client re-renders with the real value, so server HTML hydrates without a mismatch. A
 * client-only render reads the real value on its first render.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  return useMediaQueryMatch(query) ?? serverValue
}
