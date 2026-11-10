import { useEffect, useRef, useState } from 'react'
import { layoutInputKey, layoutLayersAsync, sameLayoutOptions, type LayerLayoutOptions, type LayerLayoutResult } from '../utils/layered/layout'
import type { LayeredIndex } from '../utils/layered/types'

/** One layout to compute: kept while the index and options stay equal by content. */
interface LayoutRequest {
  index: LayeredIndex
  options: LayerLayoutOptions
  key: string
}

type Landed = { request: LayoutRequest } & ({ result: LayerLayoutResult } | { error: unknown })

let warnedUnstableIndex = false
let warnedUnstableOptions = false

const isDev = () => typeof process !== 'undefined' && process.env.NODE_ENV === 'development'

/**
 * `useLayeredGraph`'s asynchronous layout. A rebuilt index or options object equal by content to
 * the last one (unmemoized `nodes`, `edges` or `layout`) keeps its request, so it neither restarts
 * the run nor drops a landed result. While a new run is pending, the last landed layout stays
 * (stale while pending). A failed run throws during render, for an error boundary.
 */
export function useAsyncLayerLayout(
  index: LayeredIndex,
  options: LayerLayoutOptions,
  enabled: boolean,
): { layout: LayerLayoutResult | null; pending: boolean } {
  const requestRef = useRef<LayoutRequest | null>(null)
  /** Whether the previous render restarted the run for new options over the same index. */
  const optionsRestartRef = useRef(false)
  let request = requestRef.current
  if (enabled) {
    const prev = request
    const sameOptions = prev !== null && sameLayoutOptions(prev.options, options)
    // The content key covers what the default node size reads; a custom `nodeSize` may read
    // anything, so with one only the same index (by identity) reuses a result.
    let key: string | null = null
    const keyOf = () => (key ??= layoutInputKey(index))
    const sameInput = prev !== null && (prev.index === index || (options.nodeSize === undefined && prev.key === keyOf()))
    const reuse = sameOptions && sameInput
    if (reuse && prev!.index !== index && !warnedUnstableIndex && isDev()) {
      warnedUnstableIndex = true
      console.warn(
        'useLayeredGraph: the layered index was rebuilt with the same content. Memoize `nodes`, `edges` and `layering` (useMemo) so large graphs are not re-indexed on every render.',
      )
    }
    const optionsRestart = prev !== null && prev.index === index && !sameOptions
    if (optionsRestart && optionsRestartRef.current && !warnedUnstableOptions && isDev()) {
      warnedUnstableOptions = true
      console.warn(
        'useLayeredGraph: the `layout` options change on every render, which restarts the asynchronous layout each time. Memoize `layout` (useMemo) and any `nodeSize` function (useCallback).',
      )
    }
    optionsRestartRef.current = optionsRestart
    if (!reuse) request = { index, options, key: keyOf() }
    requestRef.current = request
  }

  const [landed, setLanded] = useState<Landed | null>(null)
  const landedRef = useRef(landed)
  landedRef.current = landed

  useEffect(() => {
    if (!enabled || !request) return
    if (landedRef.current?.request === request) return
    const ctrl = new AbortController()
    const req = request
    layoutLayersAsync(req.index, req.options, { signal: ctrl.signal }).then(
      (result) => setLanded({ request: req, result }),
      (error: unknown) => {
        if (!ctrl.signal.aborted) setLanded({ request: req, error })
      },
    )
    return () => ctrl.abort()
  }, [enabled, request])

  if (!enabled) return { layout: null, pending: false }
  const current = landed?.request === request ? landed : null
  if (current && 'error' in current) throw current.error
  if (current) return { layout: current.result, pending: false }
  const stale = landed && 'result' in landed ? landed.result : null
  return { layout: stale, pending: true }
}
