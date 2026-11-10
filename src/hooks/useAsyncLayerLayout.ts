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
  let request = requestRef.current
  if (enabled) {
    const reuse = request !== null && (request.index === index || request.key === layoutInputKey(index)) && sameLayoutOptions(request.options, options)
    if (
      reuse &&
      request!.index !== index &&
      !warnedUnstableIndex &&
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      warnedUnstableIndex = true
      console.warn(
        'useLayeredGraph: the layered index was rebuilt with the same content. Memoize `nodes`, `edges` and `layering` (useMemo) so large graphs are not re-indexed on every render.',
      )
    }
    if (!reuse) request = { index, options, key: layoutInputKey(index) }
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
