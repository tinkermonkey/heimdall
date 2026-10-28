// How long to wait for requestAnimationFrame before running anyway. A background tab pauses
// rAF entirely, and a layout must still land there, just without a frame to paint first.
const RAF_FALLBACK_MS = 100;

/**
 * Runs `callback` once the browser has had the chance to paint the current DOM: after the next
 * animation frame, then one macrotask later (rAF callbacks run just before a paint, so the
 * setTimeout(0) lands after it). Used to let a "busy" state paint before a synchronous, possibly
 * slow, computation blocks the main thread.
 *
 * Returns a cancel function. After it is called, `callback` never runs.
 */
export function yieldToPaint(callback: () => void): () => void {
  let cancelled = false;
  let scheduled = false;
  let rafId: number | null = null;
  let fallbackId: ReturnType<typeof setTimeout> | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const afterFrame = () => {
    if (cancelled || scheduled) return;
    scheduled = true;
    if (rafId !== null) cancelAnimationFrame(rafId);
    if (fallbackId !== null) clearTimeout(fallbackId);
    timeoutId = setTimeout(() => {
      if (!cancelled) callback();
    }, 0);
  };

  if (typeof requestAnimationFrame === "function") {
    rafId = requestAnimationFrame(afterFrame);
    fallbackId = setTimeout(afterFrame, RAF_FALLBACK_MS);
  } else {
    afterFrame();
  }

  return () => {
    cancelled = true;
    if (rafId !== null) cancelAnimationFrame(rafId);
    if (fallbackId !== null) clearTimeout(fallbackId);
    if (timeoutId !== null) clearTimeout(timeoutId);
  };
}
