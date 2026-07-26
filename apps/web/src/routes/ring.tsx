import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCategories, useTodos } from '@/hooks/use-todos';
import { EFFORT_RANGE } from '@/utils/enums';

const FALLBACK_COLOR = '#a1a1aa'; // zinc-400 for uncategorized todos
const BASE_GREY = '#d4d4d8'; // zinc-300 for toggled base arcs

export const Route = createFileRoute('/ring')({
  component: RouteComponent,
});

function RouteComponent() {
  const { todos, todosLoading } = useTodos();
  const { categories } = useCategories();

  const totalEffort = useMemo(
    () => todos.reduce((sum, t) => sum + (t.effort ?? EFFORT_RANGE[0]), 0),
    [todos],
  );

  const radius = 300;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;
  const viewBoxSize = (radius + strokeWidth) * 2;
  const center = viewBoxSize / 2;
  const GAP = 24; // pixels of gap between segments

  const segments = useMemo(() => {
    let accumulated = 0;
    return [...todos]
      .sort((a, b) => {
        if (a.categoryId === null && b.categoryId === null) return 0;
        if (a.categoryId === null) return 1;
        if (b.categoryId === null) return -1;
        return a.categoryId - b.categoryId;
      })
      .map((t) => {
        const effort = t.effort ?? EFFORT_RANGE[0];
        const progress = t.progress ?? 0;
        const progressRatio = Math.min(progress / effort, 1);
        const dashLength = (effort / totalEffort) * circumference - GAP;
        const progressLength = dashLength * progressRatio;
        const offset = -accumulated;
        accumulated += dashLength + GAP;
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
        };
      });
  }, [todos, totalEffort, circumference, categories]);

  // Trigger progress animation
  const [replayKey, setReplayKey] = useState(0);
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    setAnimate(false);
    const timer = setTimeout(() => setAnimate(true), 32);
    return () => clearTimeout(timer);
  }, [replayKey]);

  const [baseGrey, setBaseGrey] = useState(false);

  return (
    <div className='mx-auto w-full max-w-4xl space-y-6 px-4 py-10'>
      {todosLoading ? (
        <p>Loading...</p>
      ) : totalEffort === 0 ? (
        <p className='text-center text-muted-foreground'>No todos yet.</p>
      ) : (
        <div className='flex flex-col items-center gap-6'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setBaseGrey((v) => !v)}
          >
            {baseGrey ? 'Show colors' : 'Grey base'}
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setReplayKey((k) => k + 1)}
          >
            Replay
          </Button>
          <svg
            viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
            className='h-[40rem] w-[40rem] -rotate-90'
          >
            {segments.map((seg) => (
              <g key={seg.id}>
                {/* Base arc: full effort, lighter */}
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill='none'
                  stroke={baseGrey ? BASE_GREY : seg.color}
                  strokeOpacity='0.2'
                  strokeWidth={strokeWidth}
                  strokeLinecap='round'
                  strokeDasharray={`${seg.dashLength} ${circumference}`}
                  strokeDashoffset={seg.dashOffset}
                />
                {/* Progress arc: animated fill, stronger */}
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill='none'
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeLinecap='round'
                  strokeDasharray={
                    animate
                      ? `${seg.progressLength} ${circumference}`
                      : `0 ${circumference}`
                  }
                  strokeDashoffset={seg.dashOffset}
                  style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
                >
                  <title>{seg.text}</title>
                </circle>
              </g>
            ))}
          </svg>

          {/* Legend */}
          <div className='flex flex-wrap justify-center gap-x-4 gap-y-2'>
            {segments.map((seg) => (
              <div key={seg.id} className='flex items-center gap-1.5 text-sm'>
                <span
                  className='inline-block h-3 w-3 rounded-full'
                  style={{ backgroundColor: seg.color }}
                />
                <span className='text-muted-foreground'>{seg.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
