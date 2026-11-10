import { useCallback, useRef, useState } from 'react'

/**
 * One piece of controllable state, the `value` / `defaultValue` / `onChange` pattern. Controlled
 * when `value` is defined (the setter only calls `onChange`); otherwise it holds its own state,
 * seeded from `defaultValue`, and the setter updates it and calls `onChange`. `null` is a value,
 * so `value={null}` is controlled. The setter is stable while the mode stays the same, and
 * always calls the latest `onChange`.
 */
export function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (value: T) => void): [T, (value: T) => void] {
  const [inner, setInner] = useState(defaultValue)
  const controlled = value !== undefined
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const set = useCallback(
    (v: T) => {
      if (!controlled) setInner(v)
      onChangeRef.current?.(v)
    },
    [controlled],
  )
  return [controlled ? (value as T) : inner, set]
}
