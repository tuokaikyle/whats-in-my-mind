import { useEffect, useRef, useState } from 'react';

type UseCountUpOptions = {
  /** Duration for the first count-up (e.g. on load). */
  durationMs?: number;
  /** Shorter duration when the target changes during hover/focus transitions. */
  transitionDurationMs?: number;
  /** When this changes, restart the count-up from 0 using `durationMs`. */
  replayKey?: number;
};

// Count-up animation: tweens the displayed value toward `target` with an ease-out
// curve. The first change uses `durationMs`; later changes (hover, deselect) use
// `transitionDurationMs` and start from the current displayed value.
export function useCountUp(
  target: number,
  { durationMs = 800, transitionDurationMs = 350, replayKey }: UseCountUpOptions = {},
) {
  const [value, setValue] = useState(0);
  const valueRef = useRef(0);
  const rafRef = useRef(0);
  const isFirstAnimationRef = useRef(true);
  const prevReplayKeyRef = useRef(replayKey);

  useEffect(() => {
    const replayTriggered = replayKey !== undefined && prevReplayKeyRef.current !== replayKey;
    if (replayKey !== undefined) prevReplayKeyRef.current = replayKey;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      cancelAnimationFrame(rafRef.current);
      valueRef.current = target;
      setValue(target);
      return;
    }

    if (replayTriggered) {
      valueRef.current = 0;
      setValue(0);
    }

    const from = replayTriggered ? 0 : valueRef.current;
    if (!replayTriggered && from === target) return;

    const duration = isFirstAnimationRef.current || replayTriggered ? durationMs : transitionDurationMs;
    isFirstAnimationRef.current = false;

    const start = performance.now();
    const easeOut = (t: number) => 1 - (1 - t) ** 3;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const next = from + (target - from) * easeOut(t);
      valueRef.current = next;
      setValue(next);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else valueRef.current = target;
    };

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, durationMs, transitionDurationMs, replayKey]);

  return value;
}
