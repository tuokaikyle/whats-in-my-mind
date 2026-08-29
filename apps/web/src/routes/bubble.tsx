import { createFileRoute } from '@tanstack/react-router';
import * as Highcharts from 'highcharts';
import 'highcharts/highcharts-more';
import HighchartsReact from 'highcharts-react-official';
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { EditTodoForm } from '@/components/edit-todo-form';
import { EmptyState } from '@/components/empty-state';
import { GuestBanner } from '@/components/guest-banner';
import { PageInfo } from '@/components/page-info';
import { PageLoader } from '@/components/page-loader';
import { useTheme } from '@/components/theme-provider';
import { TodoListPanelDrawer } from '@/components/todo-list-panel-drawer';
import { Button } from '@/components/ui/button';
import * as BaseDrawer from '@/components/ui/drawer-base';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCategories, useTodos } from '@/hooks/use-todos';
import { EFFORT_RANGE } from '@/utils/enums';
import type { Category, Task } from '@/utils/types';

export const Route = createFileRoute('/bubble')({
  component: BubblePage,
});

function buildSeries(todos: Task[], categories: Category[]) {
  const categorySeries = categories.map((category) => ({
    name: category.name,
    color: category.color ?? undefined,
    data: todos
      .filter((t) => t.categoryId === category.id)
      .map((t) => ({
        name: t.text,
        value: t.effort ?? EFFORT_RANGE[0],
        todoId: t.id,
      })),
  }));

  const knownIds = new Set(categories.map((c) => c.id));
  const uncategorized = todos.filter((t) => t.categoryId === null || !knownIds.has(t.categoryId));

  if (uncategorized.length > 0) {
    categorySeries.push({
      name: 'Other',
      color: '#6b8abc',
      data: uncategorized.map((t) => ({
        name: t.text,
        value: t.effort ?? EFFORT_RANGE[0],
        todoId: t.id,
      })),
    });
  }

  return categorySeries;
}

function BubblePage() {
  const { todos, todosLoading, isGuest, updateMutation, deleteMutation } = useTodos();
  const { categories } = useCategories();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const isMobile = useIsMobile();

  const [listPanelOpen, setListPanelOpen] = useState(false);
  const [selectedTodoId, setSelectedTodoId] = useState<number | null>(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  // Store the click handler in a ref so Highcharts callbacks can access it
  const onBubbleClickRef = useRef<(todoId: number) => void>(() => {});
  onBubbleClickRef.current = useCallback((todoId: number) => {
    setListPanelOpen(false);
    setSelectedTodoId(todoId);
    setEditDrawerOpen(true);
  }, []);

  const handleListPanelOpenChange = (open: boolean) => {
    setListPanelOpen(open);
    if (open) setEditDrawerOpen(false);
  };

  const activeTodos = todos.filter((t) => (t.progress ?? 0) < (t.effort ?? EFFORT_RANGE[0]));

  const selectedTodo = selectedTodoId != null ? (todos.find((t) => t.id === selectedTodoId) ?? null) : null;

  const textColor = isDark ? '#f5f5f5' : '#171717';
  const tooltipBg = isDark ? '#262626' : '#ffffff';
  const tooltipBorder = isDark ? '#404040' : '#e5e5e5';

  const options = useMemo<Highcharts.Options>(
    () => ({
      chart: {
        type: 'packedbubble',
        ...(isMobile ? {} : { height: 600 }),
        backgroundColor: 'transparent',
        style: {
          fontFamily: 'Inter, Geist, ui-sans-serif, system-ui, sans-serif',
        },
      },
      title: {
        text: undefined,
      },
      subtitle: {
        text: undefined,
      },
      tooltip: {
        pointFormat: '<b>{point.name}</b><br/>Effort: {point.value}',
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        style: { color: textColor },
      },
      legend: {
        layout: 'horizontal',
        align: 'center',
        verticalAlign: 'bottom',
        itemDistance: isMobile ? 6 : 12,
        itemStyle: {
          color: textColor,
          fontWeight: 'normal',
          fontSize: isMobile ? '10px' : '12px',
        },
        itemHoverStyle: { color: textColor },
      },
      plotOptions: {
        packedbubble: {
          minSize: isMobile ? 32 : 40,
          maxSize: isMobile ? 72 : 100,
          marker: {
            fillOpacity: 0.5,
          },
          dataLabels: {
            enabled: true,
            allowOverlap: false,
            formatter: function () {
              const name = String(this.name ?? '');
              const max = 14;
              return name.length > max ? `${name.slice(0, max - 1)}…` : name;
            },
            style: {
              color: isDark ? '#e5e5e5' : '#171717',
              fontSize: isMobile ? '10px' : '11px',
              textOutline: 'none',
              fontWeight: 'normal',
            },
          },
          point: {
            events: {
              click: function () {
                const todoId = (this as unknown as Record<string, unknown>).todoId as number | undefined;
                if (todoId != null) {
                  onBubbleClickRef.current(todoId);
                }
              },
            },
          },
        },
      },
      series: buildSeries(activeTodos, categories) as Highcharts.SeriesOptionsType[],
      credits: { enabled: false },
    }),
    [activeTodos, categories, isDark, isMobile, textColor, tooltipBg, tooltipBorder],
  );

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
          <div>
            <h1 className='flex items-center gap-1.5 text-lg font-semibold text-foreground'>
              Bubble
              <PageInfo page='bubble' />
            </h1>
            <p className='text-sm text-muted-foreground'>Grouped by category. Bubble size reflects effort.</p>
          </div>
          <HighchartsReact
            highcharts={Highcharts}
            options={options}
            containerProps={{
              className: isMobile ? 'w-full h-[clamp(300px,55vh,600px)]' : 'w-full',
            }}
          />
        </>
      )}

      <div className='flex justify-center'>
        {/* List panel drawer (Base UI) with nested edit drawer */}
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

        {/* Standalone edit drawer (Base UI) */}
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
    </div>
  );
}
