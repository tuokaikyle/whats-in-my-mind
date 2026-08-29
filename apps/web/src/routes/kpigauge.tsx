import { createFileRoute } from '@tanstack/react-router';
import * as Highcharts from 'highcharts';
import { Check } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import 'highcharts/highcharts-more';
import 'highcharts/modules/solid-gauge';
import HighchartsReact from 'highcharts-react-official';
import { EditTodoForm } from '@/components/edit-todo-form';
import { EmptyState } from '@/components/empty-state';
import { GuestBanner } from '@/components/guest-banner';
import { PageLoader } from '@/components/page-loader';
import { PageInfo } from '@/components/page-info';
import { useTheme } from '@/components/theme-provider';
import { TodoListPanelDrawer } from '@/components/todo-list-panel-drawer';
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
  selectedTodos: Task[],
  categories: { id: number; name: string; color: string | null }[],
): RingSlice[] {
  const shown = selectedTodos.slice(0, RING_COUNT);
  const count = shown.length;
  // Distribute rings between 100% and INNER_HOLE_PCT so the innermost ring
  // sits flush against the white center disk.
  const bandWidth = count > 0 ? (100 - INNER_HOLE_PCT + RING_GAP_PCT) / count - RING_GAP_PCT : 0;

  return shown.map((todo, index) => {
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
      height: '100%',
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
      followPointer: true,
      hideDelay: 0,
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
  const inProgressTodos = useMemo(() => activeTodos.filter((t) => (t.progress ?? 0) > 0), [activeTodos]);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current || todosLoading || activeTodos.length === 0) return;
    // Prefer 3 items whose progress is greater than 0; fill any remaining
    // slots with other active tasks so the gauge has something to show.
    const priority = [...inProgressTodos, ...activeTodos.filter((t) => (t.progress ?? 0) === 0)];
    setSelectedIds(priority.slice(0, RING_COUNT).map((t) => t.id));
    initializedRef.current = true;
  }, [todosLoading, activeTodos, inProgressTodos]);

  const selectedTodos = useMemo(
    () => selectedIds.map((id) => todos.find((t) => t.id === id)).filter((t): t is Task => t !== undefined),
    [selectedIds, todos],
  );
  const slices = useMemo(() => buildSlices(selectedTodos, categories), [selectedTodos, categories]);

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

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= RING_COUNT) return prev;
      return [...prev, id];
    });
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
      ) : todos.length === 0 ? (
        <EmptyState title='No todos yet' description='Add items in the Simple view to see them here.' />
      ) : (
        <>
          <div className='mb-6'>
            <h1 className='flex items-center gap-1.5 text-lg font-semibold' style={{ color: textColor }}>
              KPI Gauge
              <PageInfo page='kpigauge' />
            </h1>
            <p className='text-sm' style={{ color: mutedColor }}>
              Pick up to {RING_COUNT} tasks to display as concentric rings.
            </p>
          </div>

          <div className='flex flex-col items-center gap-6'>
            <div className='relative aspect-square w-full max-w-[440px] min-w-0 overflow-hidden'>
              <HighchartsReact
                highcharts={Highcharts}
                options={options}
                containerProps={{ className: 'h-full w-full' }}
              />
            </div>

            {slices.length > 0 ? (
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
            ) : (
              <p className='text-sm' style={{ color: mutedColor }}>
                Select up to {RING_COUNT} items below to populate the gauge.
              </p>
            )}
          </div>

          <section className='rounded-lg border bg-card p-4'>
            <div className='mb-3 flex items-center justify-between'>
              <h2 className='text-sm font-semibold' style={{ color: textColor }}>
                Select up to {RING_COUNT} items
              </h2>
              <span className='text-xs tabular-nums' style={{ color: mutedColor }}>
                {selectedIds.length}/{RING_COUNT} selected
              </span>
            </div>
            <div className='flex flex-wrap gap-1.5'>
              {todos.map((todo, index) => {
                const isSelected = selectedIds.includes(todo.id);
                const disabled = !isSelected && selectedIds.length >= RING_COUNT;
                const category = categories.find((c) => c.id === todo.categoryId);
                const dotColor = pickColor(index, category?.color);
                return (
                  <button
                    key={todo.id}
                    type='button'
                    disabled={disabled}
                    onClick={() => toggleSelect(todo.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-left text-sm transition-colors',
                      isSelected ? 'border-green-500 bg-green-500/10' : 'border-border hover:bg-muted/50',
                      disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent',
                    )}
                  >
                    <span className='relative flex h-3.5 w-3.5 shrink-0 items-center justify-center'>
                      <span className='inline-block h-3.5 w-3.5 rounded-full' style={{ backgroundColor: dotColor }} />
                      {isSelected && <Check className='absolute h-3 w-3 text-white' strokeWidth={3} />}
                    </span>
                    <span className='truncate'>{todo.text}</span>
                  </button>
                );
              })}
            </div>
          </section>

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
