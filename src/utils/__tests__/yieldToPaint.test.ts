import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { yieldToPaint } from '../yieldToPaint'

describe('yieldToPaint', () => {
  let frames: Array<() => void>

  beforeEach(() => {
    vi.useFakeTimers()
    frames = []
    vi.stubGlobal('requestAnimationFrame', (cb: () => void) => frames.push(cb))
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      frames[id - 1] = () => {}
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  const flushFrame = () => {
    const pending = frames
    frames = []
    pending.forEach((cb) => cb())
  }

  it('runs only after an animation frame and one more macrotask', () => {
    const cb = vi.fn()
    yieldToPaint(cb)
    vi.advanceTimersByTime(1)
    expect(cb).not.toHaveBeenCalled()
    flushFrame()
    expect(cb).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('never runs once cancelled, at any stage', () => {
    const before = vi.fn()
    yieldToPaint(before)()
    flushFrame()
    vi.runAllTimers()
    expect(before).not.toHaveBeenCalled()

    const between = vi.fn()
    const cancel = yieldToPaint(between)
    flushFrame()
    cancel()
    vi.runAllTimers()
    expect(between).not.toHaveBeenCalled()
  })

  it('still runs when no frame arrives (a background tab pauses rAF)', () => {
    const cb = vi.fn()
    yieldToPaint(cb)
    vi.advanceTimersByTime(100)
    vi.advanceTimersByTime(1)
    expect(cb).toHaveBeenCalledTimes(1)
    flushFrame()
    vi.runAllTimers()
    expect(cb).toHaveBeenCalledTimes(1)
  })
})
