import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { EditTodoForm } from '@/components/edit-todo-form';
import { EmptyState } from '@/components/empty-state';
import { GuestBanner } from '@/components/guest-banner';
import { PageLoader } from '@/components/page-loader';
import { TodoListPanelDrawer } from '@/components/todo-list-panel-drawer';
import { Button } from '@/components/ui/button';
import * as BaseDrawer from '@/components/ui/drawer-base';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCategories, useTodos } from '@/hooks/use-todos';
import { cn } from '@/lib/utils';
import { EFFORT_RANGE } from '@/utils/enums';

const FALLBACK_COLOR = '#a1a1aa'; // zinc-400 for uncategorized todos

const RING_RADIUS = 300;
const RING_STROKE_WIDTH = 24;
const RING_HOVER_STROKE_BOOST = 5;
/** Wider invisible target; stays proportional to visible stroke. */
const HIT_STROKE_WIDTH = RING_STROKE_WIDTH + 18;

/** Round caps only when segments are large enough to separate cleanly. */
const ROUNDED_SEGMENT_TODO_LIMIT = 16;

const SEGMENT_GAP = {
  /** Separation in compact (butt cap) mode. */
  compact: 5,
} as const;

type RingSegmentStyle = {
  gap: number;
  strokeLinecap: 'round' | 'butt';
};

function getRingSegmentStyle(todoCount: number, circumference: number, strokeWidth: number): RingSegmentStyle {
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

function formatProgressPercent(ratio: number) {
  return `${Math.round(ratio * 100)}%`;
}

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
function useCountUp(
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

const RING_HOVER_TARGET_SELECTOR = '[data-ring-segment-hit], [data-ring-legend-item]';

function isRingHoverTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest(RING_HOVER_TARGET_SELECTOR));
}

function shouldClearRingHighlight(event: React.MouseEvent) {
  return !isRingHoverTarget(event.relatedTarget);
}

export const Route = createFileRoute('/ring')({
  component: RouteComponent,
});

function RouteComponent() {
  const { todos, todosLoading, isGuest, updateMutation, deleteMutation } = useTodos();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const isMobile = useIsMobile();

  const activeTodos = useMemo(() => todos.filter((t) => (t.progress ?? 0) < (t.effort ?? EFFORT_RANGE[0])), [todos]);

  const totalEffort = useMemo(
    () => activeTodos.reduce((sum, t) => sum + (t.effort ?? EFFORT_RANGE[0]), 0),
    [activeTodos],
  );

  const radius = RING_RADIUS;
  const strokeWidth = RING_STROKE_WIDTH;
  const circumference = 2 * Math.PI * radius;
  const viewBoxSize = (radius + strokeWidth) * 2;
  const center = viewBoxSize / 2;

  const segmentStyle = useMemo(
    () => getRingSegmentStyle(activeTodos.length, circumference, strokeWidth),
    [activeTodos.length, circumference, strokeWidth],
  );

  const segments = useMemo(() => {
    let accumulated = 0;
    const { gap } = segmentStyle;
    return [...activeTodos]
      .sort((a, b) => {
        if (a.categoryId === null && b.categoryId === null) return a.id - b.id;
        if (a.categoryId === null) return 1;
        if (b.categoryId === null) return -1;
        return a.categoryId - b.categoryId || a.id - b.id;
      })
      .map((t) => {
        const effort = t.effort ?? EFFORT_RANGE[0];
        const progress = t.progress ?? 0;
        const progressRatio = Math.min(progress / effort, 1);
        const dashLength = segmentDashLength(effort, totalEffort, circumference, gap);
        const progressLength = dashLength * progressRatio;
        const offset = -accumulated;
        accumulated += dashLength + gap;
        const category = categories.find((c) => c.id === t.categoryId);
        return {
          id: t.id,
          text: t.text,
          effort,
          progress,
          progressRatio,
          dashLength,
          progressLength,
          dashOffset: offset,
          color: category?.color ?? FALLBACK_COLOR,
          categoryName: category?.name ?? 'Uncategorized',
        };
      });
  }, [activeTodos, totalEffort, circumference, categories, segmentStyle]);

  const ringSummary = useMemo(() => {
    const totalProgress = segments.reduce((sum, seg) => sum + seg.progress, 0);
    const overallRatio = totalEffort > 0 ? totalProgress / totalEffort : 0;

    return {
      totalProgress,
      overallRatio,
      todoCount: segments.length,
    };
  }, [segments, totalEffort]);

  const [replayKey, setReplayKey] = useState(0);
  const [trackHidden, setTrackHidden] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);

  const hitStrokeWidth = isMobile ? HIT_STROKE_WIDTH + 14 : HIT_STROKE_WIDTH;

  // Drawer state
  const [listPanelOpen, setListPanelOpen] = useState(false);
  const [selectedTodoId, setSelectedTodoId] = useState<number | null>(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  const selectedTodo = selectedTodoId != null ? (todos.find((t) => t.id === selectedTodoId) ?? null) : null;

  const handleSegmentClick = (id: number) => {
    setListPanelOpen(false);
    setSelectedTodoId(id);
    setEditDrawerOpen(true);
  };

  const handleSegmentActivate = (id: number) => {
    if (isMobile) {
      if (activeId === id) {
        handleSegmentClick(id);
        return;
      }
      setActiveId(id);
      return;
    }

    handleSegmentClick(id);
  };

  const handleListPanelOpenChange = (open: boolean) => {
    setListPanelOpen(open);
    if (open) setEditDrawerOpen(false);
  };

  const displayId = hoveredId ?? activeId;
  const displaySegment = displayId != null ? (segments.find((seg) => seg.id === displayId) ?? null) : null;
  const displayRatio = displaySegment ? displaySegment.progressRatio : ringSummary.overallRatio;
  const animatedRatio = useCountUp(displayRatio, { replayKey });

  const isSegmentHighlighted = (id: number) => hoveredId === id || activeId === id;
  const highlightSegment = (id: number) => setHoveredId(id);
  const clearHighlight = () => setHoveredId(null);
  const handleHoverLeave = (event: React.MouseEvent) => {
    if (shouldClearRingHighlight(event)) clearHighlight();
  };

  return (
    <div className='mx-auto w-full max-w-4xl space-y-6 px-4 py-10'>
      {isGuest && <GuestBanner />}

      {todosLoading || categoriesLoading ? (
        <PageLoader size='lg' />
      ) : activeTodos.length === 0 ? (
        <EmptyState
          title={todos.length === 0 ? 'No todos yet' : 'No tasks in progress'}
          description='Add items in the Simple view to see them here.'
        />
      ) : (
        <>
          <div className='mb-6 w-full'>
            <h1 className='text-lg font-semibold text-foreground'>Ring</h1>
            <p className='text-sm text-muted-foreground'>Each arc is a task; length is effort, fill is progress.</p>
          </div>

          <div className='flex flex-col items-center gap-6'>
            <div className='flex items-center gap-2'>
              <Button variant='outline' size='sm' onClick={() => setTrackHidden((v) => !v)}>
                {trackHidden ? 'Show track' : 'Hide track'}
              </Button>
              <Button variant='outline' size='sm' onClick={() => setReplayKey((k) => k + 1)}>
                Replay
              </Button>
            </div>

            <div className='flex w-full flex-col items-center gap-6'>
              <div className='relative aspect-square w-full max-w-[40rem]'>
                <svg
                  viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
                  className='size-full -rotate-90'
                  role='img'
                  aria-label={`Ring chart: ${activeTodos.length} active todo${
                    activeTodos.length === 1 ? '' : 's'
                  }, ${totalEffort} total effort`}
                >
                  {/* biome-ignore lint/a11y/useSemanticElements: SVG <rect> cannot be an HTML <button>; role="button" is the ARIA-correct pattern for interactive SVG */}
                  <rect
                    x={0}
                    y={0}
                    width={viewBoxSize}
                    height={viewBoxSize}
                    fill='transparent'
                    role='button'
                    tabIndex={0}
                    aria-label='Deselect segment'
                    onMouseEnter={clearHighlight}
                    onClick={() => setActiveId(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
                        e.preventDefault();
                        setActiveId(null);
                      }
                    }}
                  />
                  {segments.map((seg) => {
                    const isHighlighted = isSegmentHighlighted(seg.id);

                    return (
                      <g
                        key={seg.id}
                        className={cn(
                          'ring-segment transition-[opacity,filter] duration-150',
                          isHighlighted && 'ring-segment--hovered',
                        )}
                      >
                        {/* Base arc: full effort, lighter */}
                        <circle
                          cx={center}
                          cy={center}
                          r={radius}
                          fill='none'
                          stroke={trackHidden ? 'transparent' : seg.color}
                          strokeOpacity={isHighlighted ? 0.45 : 0.2}
                          strokeWidth={strokeWidth}
                          strokeLinecap={segmentStyle.strokeLinecap}
                          strokeDasharray={`${seg.dashLength} ${circumference}`}
                          strokeDashoffset={seg.dashOffset}
                          className='pointer-events-none'
                        />
                        {/* Progress arc: animated fill, stronger */}
                        <circle
                          key={`${seg.id}-${replayKey}`}
                          cx={center}
                          cy={center}
                          r={radius}
                          fill='none'
                          stroke={seg.color}
                          strokeWidth={isHighlighted ? strokeWidth + RING_HOVER_STROKE_BOOST : strokeWidth}
                          strokeLinecap={segmentStyle.strokeLinecap}
                          strokeDashoffset={seg.dashOffset}
                          className='ring-progress-arc pointer-events-none'
                          style={
                            {
                              color: seg.color,
                              '--ring-circumference': circumference,
                              '--ring-progress': seg.progressLength,
                            } as React.CSSProperties
                          }
                        />
                        {/* Invisible wider stroke for easier hover targeting */}
                        {/* biome-ignore lint/a11y/useSemanticElements: SVG <circle> cannot be an HTML <button>; role="button" is the ARIA-correct pattern for interactive SVG */}
                        <circle
                          cx={center}
                          cy={center}
                          r={radius}
                          fill='none'
                          stroke='transparent'
                          strokeWidth={hitStrokeWidth}
                          strokeLinecap={segmentStyle.strokeLinecap}
                          strokeDasharray={`${seg.dashLength} ${circumference}`}
                          strokeDashoffset={seg.dashOffset}
                          className='cursor-pointer touch-manipulation'
                          pointerEvents='stroke'
                          role='button'
                          tabIndex={0}
                          data-ring-segment-hit={seg.id}
                          onMouseEnter={() => highlightSegment(seg.id)}
                          onMouseLeave={handleHoverLeave}
                          onClick={() => handleSegmentActivate(seg.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleSegmentActivate(seg.id);
                            }
                          }}
                          aria-label={`${seg.text}, ${seg.progress} of ${seg.effort} complete`}
                        />
                      </g>
                    );
                  })}
                </svg>

                <div className='pointer-events-none absolute inset-0 flex items-center justify-center px-4 sm:px-6'>
                  <div className='max-w-[min(100%,14rem)] text-center'>
                    {displaySegment ? (
                      <>
                        <p className='truncate text-sm font-semibold text-foreground'>{displaySegment.text}</p>
                        <p className='mt-0.5 text-xs text-muted-foreground'>{displaySegment.categoryName}</p>
                        <p className='mt-1.5 text-3xl font-bold tabular-nums tracking-tight text-foreground sm:text-4xl'>
                          {formatProgressPercent(animatedRatio)}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          {displaySegment.progress} / {displaySegment.effort} effort
                        </p>
                        {isMobile && activeId === displaySegment.id && (
                          <p className='mt-1.5 text-[10px] text-muted-foreground'>Tap again to edit</p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className='text-sm font-medium text-muted-foreground'>Overall</p>
                        <p className='mt-0.5 text-3xl font-bold tabular-nums tracking-tight text-foreground sm:text-4xl'>
                          {formatProgressPercent(animatedRatio)}
                        </p>
                        <p className='mt-1.5 text-xs text-muted-foreground'>
                          {ringSummary.totalProgress} / {totalEffort} effort
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          {ringSummary.todoCount} {ringSummary.todoCount === 1 ? 'todo' : 'todos'} in progress
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className='flex w-full flex-wrap justify-center gap-x-2 gap-y-2 px-1'>
                {segments.map((seg) => {
                  const isHighlighted = isSegmentHighlighted(seg.id);

                  return (
                    <button
                      key={seg.id}
                      type='button'
                      data-ring-legend-item={seg.id}
                      className={cn(
                        'flex items-center gap-1.5 rounded-md text-sm transition-colors touch-manipulation',
                        isMobile ? 'min-h-11 px-3 py-2' : 'px-2 py-1',
                        isHighlighted ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/60',
                      )}
                      onMouseEnter={() => highlightSegment(seg.id)}
                      onMouseLeave={handleHoverLeave}
                      onFocus={() => highlightSegment(seg.id)}
                      onBlur={clearHighlight}
                      onClick={() => {
                        if (isMobile) handleSegmentActivate(seg.id);
                      }}
                      aria-pressed={activeId === seg.id}
                    >
                      <span
                        className={cn(
                          'inline-block h-3 w-3 shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-background transition-transform',
                          isHighlighted ? 'scale-110 ring-current' : 'ring-transparent',
                        )}
                        style={{ backgroundColor: seg.color, color: seg.color }}
                      />
                      <span className='max-w-[12rem] truncate'>{seg.text}</span>
                      <span className='tabular-nums text-xs opacity-70'>
                        {seg.progress}/{seg.effort}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className='flex justify-center'>
            <BaseDrawer.Drawer
              swipeDirection='right'
              modal={false}
              open={listPanelOpen}
              onOpenChange={handleListPanelOpenChange}
            >
              <BaseDrawer.DrawerTrigger
                render={<Button variant='secondary'>{listPanelOpen ? 'Hide panel' : 'Show panel'}</Button>}
              />
              <BaseDrawer.DrawerContent>
                <BaseDrawer.DrawerHeader>
                  <BaseDrawer.DrawerTitle>Todos</BaseDrawer.DrawerTitle>
                  <BaseDrawer.DrawerDescription>
                    Click an item&apos;s edit icon to open a nested drawer.
                  </BaseDrawer.DrawerDescription>
                </BaseDrawer.DrawerHeader>
                <div className='flex-1 overflow-hidden'>
                  <TodoListPanelDrawer />
                </div>
                <BaseDrawer.DrawerFooter>
                  <BaseDrawer.DrawerClose render={<Button variant='outline'>Close</Button>} />
                </BaseDrawer.DrawerFooter>
              </BaseDrawer.DrawerContent>
            </BaseDrawer.Drawer>

            <BaseDrawer.Drawer
              swipeDirection='right'
              modal={false}
              open={editDrawerOpen}
              onOpenChange={setEditDrawerOpen}
              onOpenChangeComplete={(open) => {
                if (!open) setSelectedTodoId(null);
              }}
            >
              {selectedTodo && (
                <BaseDrawer.DrawerContent>
                  <BaseDrawer.DrawerHeader className='border-b'>
                    <BaseDrawer.DrawerTitle>Edit Todo</BaseDrawer.DrawerTitle>
                    <BaseDrawer.DrawerDescription>Update this item&apos;s details.</BaseDrawer.DrawerDescription>
                  </BaseDrawer.DrawerHeader>
                  <div className='flex-1 overflow-y-auto p-4'>
                    <EditTodoForm
                      key={selectedTodo.id}
                      todo={selectedTodo}
                      categories={categories}
                      isUpdating={updateMutation.isPending}
                      onUpdate={(data) =>
                        updateMutation.mutate(
                          { id: selectedTodo.id, ...data },
                          {
                            onSuccess: () => setEditDrawerOpen(false),
                            onError: (error) =>
                              toast.error(error instanceof Error ? error.message : 'Failed to update todo'),
                          },
                        )
                      }
                      onDelete={() => {
                        deleteMutation.mutate({ id: selectedTodo.id });
                        setEditDrawerOpen(false);
                      }}
                      onClose={() => setEditDrawerOpen(false)}
                    />
                  </div>
                </BaseDrawer.DrawerContent>
              )}
            </BaseDrawer.Drawer>
          </div>
        </>
      )}
    </div>
  );
}
