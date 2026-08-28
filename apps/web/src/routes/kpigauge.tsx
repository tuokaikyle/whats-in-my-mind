import { createFileRoute } from '@tanstack/react-router';
import * as Highcharts from 'highcharts';
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import 'highcharts/highcharts-more';
import 'highcharts/modules/solid-gauge';
import HighchartsReact from 'highcharts-react-official';
import { EditTodoForm } from '@/components/edit-todo-form';
import { EmptyState } from '@/components/empty-state';
import { GuestBanner } from '@/components/guest-banner';
import { PageLoader } from '@/components/page-loader';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import * as BaseDrawer from '@/components/ui/drawer-base';
import { useCategories, useTodos } from '@/hooks/use-todos';
import { cn } from '@/lib/utils';
import { EFFORT_RANGE, highChartColors } from '@/utils/enums';
import type { Task } from '@/utils/types';

export const Route = createFileRoute('/kpigauge')({
  component: KpiGaugePage,
});

const RING_COUNT = 3;
const RING_GAP_PCT = 2;
const INNER_HOLE_PCT = 30; // reserved blank white center
const FALLBACK_PALETTE = Object.values(highChartColors);

// Deterministic PRNG so a given `seed` always picks the same 3 todos,
// keeping the selection stable between renders until the user reshuffles.
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type RingSlice = {
  id: number;
  text: string;
  effort: number;
  progress: number;
  progressPct: number;
  color: string;
  categoryName: string;
  outerRadius: number;
  innerRadius: number;
};

function pickColor(index: number, categoryColor: string | null | undefined): string {
  if (categoryColor) return categoryColor;
  return FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
}

function buildSlices(
  activeTodos: Task[],
  categories: { id: number; name: string; color: string | null }[],
  seed: number,
): RingSlice[] {
  const rng = mulberry32(seed || 1);
  const shuffled = [...activeTodos].sort(() => rng() - 0.5);
  const shown = shuffled.slice(0, RING_COUNT);

  const count = shown.length;
  // Distribute rings between 100% and INNER_HOLE_PCT so the innermost ring
  // sits flush against the white center disk.
  const bandWidth = count > 0 ? (100 - INNER_HOLE_PCT + RING_GAP_PCT) / count - RING_GAP_PCT : 0;

  const slices: RingSlice[] = shown.map((todo, index) => {
    const effort = todo.effort ?? EFFORT_RANGE[0];
    const progress = Math.max(0, Math.min(effort, todo.progress ?? 0));
    const progressPct = effort > 0 ? Math.round((progress / effort) * 100) : 0;
    const category = categories.find((c) => c.id === todo.categoryId);
    const color = pickColor(index, category?.color);

    const outerRadius = Math.round((100 - index * (bandWidth + RING_GAP_PCT)) * 10) / 10;
    const innerRadius = Math.round((outerRadius - bandWidth) * 10) / 10;

    return {
      id: todo.id,
      text: todo.text,
      effort,
      progress,
      progressPct,
      color,
      categoryName: category?.name ?? 'Uncategorized',
      outerRadius,
      innerRadius,
    };
  });

  return slices;
}

function buildOptions(slices: RingSlice[], isDark: boolean): Highcharts.Options {
  const textColor = isDark ? '#f5f5f5' : '#171717';

  const paneBackgrounds = [
    // Blank white center disk
    {
      outerRadius: `${INNER_HOLE_PCT}%`,
      innerRadius: '0%',
      backgroundColor: '#ffffff',
      borderWidth: 0,
    },
    ...slices.map((slice) => ({
      outerRadius: `${slice.outerRadius}%`,
      innerRadius: `${slice.innerRadius}%`,
      backgroundColor: `${slice.color}33`,
      borderWidth: 0,
    })),
  ];

  return {
    chart: {
      type: 'solidgauge',
      height: 320,
      width: 320,
      backgroundColor: 'transparent',
      style: { fontFamily: 'Inter, Geist, ui-sans-serif, system-ui, sans-serif' },
      spacing: [0, 0, 0, 0],
    },
    title: { text: undefined },
    tooltip: {
      backgroundColor: isDark ? '#171717' : '#ffffff',
      borderColor: isDark ? '#404040' : '#e5e5e5',
      style: { color: textColor, fontSize: '13px' },
      pointFormat: '<b>{point.name}</b><br/>{point.y}% of effort',
      useHTML: true,
    },
    pane: {
      startAngle: 0,
      endAngle: 360,
      margin: 0,
      background: paneBackgrounds as unknown as Highcharts.PaneBackgroundOptions[],
    } as unknown as Highcharts.PaneOptions,
    yAxis: { min: 0, max: 100, lineWidth: 0, tickPositions: [] },
    plotOptions: {
      solidgauge: {
        dataLabels: { enabled: false },
        linecap: 'round',
        rounded: true,
        stickyTracking: false,
      },
    },
    series: slices.map((slice) => ({
      name: slice.text,
      type: 'solidgauge',
      data: [
        {
          name: slice.text,
          color: slice.color,
          radius: `${slice.outerRadius}%`,
          innerRadius: `${slice.innerRadius}%`,
          y: slice.progressPct,
        },
      ],
    })) as Highcharts.SeriesOptionsType[],
    credits: { enabled: false },
    xAxis: { visible: false },
  };
}

function KpiGaugePage() {
  const { todos, todosLoading, isGuest, updateMutation, deleteMutation } = useTodos();
  const { categories } = useCategories();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const activeTodos = useMemo(() => todos.filter((t) => (t.progress ?? 0) < (t.effort ?? EFFORT_RANGE[0])), [todos]);

  const [seed, setSeed] = useState(0);
  const slices = useMemo(() => buildSlices(activeTodos, categories, seed), [activeTodos, categories, seed]);

  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [listPanelOpen, setListPanelOpen] = useState(false);
  const [selectedTodoId, setSelectedTodoId] = useState<number | null>(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  const onSliceClickRef = useRef<(todoId: number) => void>(() => {});
  onSliceClickRef.current = useCallback((todoId: number) => {
    setListPanelOpen(false);
    setSelectedTodoId(todoId);
    setEditDrawerOpen(true);
  }, []);

  const handleListPanelOpenChange = (open: boolean) => {
    setListPanelOpen(open);
    if (open) setEditDrawerOpen(false);
  };

  const selectedTodo = selectedTodoId != null ? (todos.find((t) => t.id === selectedTodoId) ?? null) : null;

  const textColor = isDark ? '#f5f5f5' : '#171717';
  const mutedColor = isDark ? '#a3a3a3' : '#737373';
  const options = useMemo(() => buildOptions(slices, isDark), [slices, isDark]);

  return (
    <div className='mx-auto w-full max-w-4xl space-y-6 px-4 py-10'>
      {isGuest && <GuestBanner />}

      {todosLoading ? (
        <PageLoader size='lg' />
      ) : activeTodos.length === 0 ? (
        <EmptyState
          title={todos.length === 0 ? 'No todos yet' : 'No tasks in progress'}
          description='Add items in the Simple view to see them here.'
        />
      ) : (
        <>
          <div className='mb-6'>
            <h1 className='text-lg font-semibold' style={{ color: textColor }}>
              KPI Gauge
            </h1>
            <p className='text-sm' style={{ color: mutedColor }}>
              Three random active tasks, each as a concentric ring.
            </p>
          </div>

          <div className='flex flex-col items-center gap-6'>
            <Button variant='outline' size='sm' onClick={() => setSeed((s) => s + 1)}>
              Shuffle
            </Button>

            <div className='relative'>
              <HighchartsReact highcharts={Highcharts} options={options} />
            </div>

            <div className='flex w-full flex-wrap justify-center gap-x-2 gap-y-2 px-1'>
              {slices.map((slice) => {
                const isHighlighted = hoveredId === slice.id;
                return (
                  <button
                    key={slice.id}
                    type='button'
                    className={cn(
                      'flex items-center gap-1.5 rounded-md text-sm transition-colors touch-manipulation px-2 py-1',
                      isHighlighted ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/60',
                    )}
                    onMouseEnter={() => setHoveredId(slice.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onFocus={() => setHoveredId(slice.id)}
                    onBlur={() => setHoveredId(null)}
                    onClick={() => onSliceClickRef.current(slice.id)}
                  >
                    <span
                      className='inline-block h-3 w-3 shrink-0 rounded-full transition-transform'
                      style={{
                        backgroundColor: slice.color,
                        boxShadow: isHighlighted ? `0 0 0 2px ${slice.color}` : undefined,
                      }}
                    />
                    <span className='max-w-[12rem] truncate'>{slice.text}</span>
                    <span className='tabular-nums text-xs opacity-70'>
                      {slice.progress}/{slice.effort}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className='flex justify-center'>
            <BaseDrawer.Drawer
              swipeDirection='right'
              modal={false}
              open={listPanelOpen}
              onOpenChange={handleListPanelOpenChange}
            >
              <BaseDrawer.DrawerTrigger render={<Button variant='secondary'>Show item editor panel</Button>} />
              <BaseDrawer.DrawerContent>
                <BaseDrawer.DrawerHeader>
                  <BaseDrawer.DrawerTitle>Todos</BaseDrawer.DrawerTitle>
                  <BaseDrawer.DrawerDescription>
                    Click an item&apos;s edit icon to open a nested drawer.
                  </BaseDrawer.DrawerDescription>
                </BaseDrawer.DrawerHeader>
                <div className='flex-1 overflow-hidden'>{/* list panel placeholder */}</div>
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
