import { EFFORT_RANGE } from '@/utils/enums';
import type { Category, Task } from '@/utils/types';

export const FALLBACK_COLOR = '#a1a1aa'; // zinc-400 for uncategorized todos

export const RING_RADIUS = 300;
export const RING_STROKE_WIDTH = 24;
export const RING_HOVER_STROKE_BOOST = 5;
/** Wider invisible target; stays proportional to visible stroke. */
export const HIT_STROKE_WIDTH = RING_STROKE_WIDTH + 18;

/** Round caps only when segments are large enough to separate cleanly. */
export const ROUNDED_SEGMENT_TODO_LIMIT = 16;

const SEGMENT_GAP = {
  /** Separation in compact (butt cap) mode. */
  compact: 5,
} as const;

export type RingSegmentStyle = {
  gap: number;
  strokeLinecap: 'round' | 'butt';
};

export type RingSegmentData = {
  id: number;
  text: string;
  effort: number;
  progress: number;
  progressRatio: number;
  dashLength: number;
  progressLength: number;
  dashOffset: number;
  color: string;
  categoryName: string;
};

export type RingGeometry = {
  radius: number;
  strokeWidth: number;
  hitStrokeWidth: number;
  circumference: number;
  viewBoxSize: number;
  center: number;
};

export type RingSummary = {
  totalProgress: number;
  overallRatio: number;
  todoCount: number;
};

export function getRingSegmentStyle(todoCount: number, circumference: number, strokeWidth: number): RingSegmentStyle {
  const useRoundedCaps = todoCount <= ROUNDED_SEGMENT_TODO_LIMIT;
  const avgArcLength = circumference / Math.max(todoCount, 1);
  // Round caps bulge ~half the stroke width into each adjacent gap.
  const minRoundGap = strokeWidth * 1.4;
  const maxRoundGap = strokeWidth * 2.1;

  if (useRoundedCaps) {
    const gap = Math.min(maxRoundGap, Math.max(minRoundGap, avgArcLength * 0.24));
    return { gap, strokeLinecap: 'round' };
  }

  const gap = Math.min(Math.max(SEGMENT_GAP.compact, strokeWidth * 0.18), avgArcLength * 0.08);
  return { gap, strokeLinecap: 'butt' };
}

function segmentDashLength(effort: number, totalEffort: number, circumference: number, gap: number) {
  return Math.max(0, (effort / totalEffort) * circumference - gap);
}

export function formatProgressPercent(ratio: number) {
  return `${Math.round(ratio * 100)}%`;
}

// Sort so uncategorized todos cluster at the end; otherwise by category then id.
function sortByCategoryThenId(a: Task, b: Task) {
  if (a.categoryId === null && b.categoryId === null) return a.id - b.id;
  if (a.categoryId === null) return 1;
  if (b.categoryId === null) return -1;
  return a.categoryId - b.categoryId || a.id - b.id;
}

export function buildSegments(
  activeTodos: Task[],
  categories: Category[],
  totalEffort: number,
  circumference: number,
  gap: number,
): RingSegmentData[] {
  let accumulated = 0;
  return [...activeTodos].sort(sortByCategoryThenId).map((todo) => {
    const effort = todo.effort ?? EFFORT_RANGE[0];
    const progress = todo.progress ?? 0;
    const progressRatio = Math.min(progress / effort, 1);
    const dashLength = segmentDashLength(effort, totalEffort, circumference, gap);
    const progressLength = dashLength * progressRatio;
    const dashOffset = -accumulated;
    accumulated += dashLength + gap;
    const category = categories.find((c) => c.id === todo.categoryId);
    return {
      id: todo.id,
      text: todo.text,
      effort,
      progress,
      progressRatio,
      dashLength,
      progressLength,
      dashOffset,
      color: category?.color ?? FALLBACK_COLOR,
      categoryName: category?.name ?? 'Uncategorized',
    };
  });
}

export const RING_HOVER_TARGET_SELECTOR = '[data-ring-segment-hit], [data-ring-legend-item]';

export function isRingHoverTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest(RING_HOVER_TARGET_SELECTOR));
}

export function shouldClearRingHighlight(event: React.MouseEvent) {
  return !isRingHoverTarget(event.relatedTarget);
}
