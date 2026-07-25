import { createFileRoute } from '@tanstack/react-router';
import * as Highcharts from 'highcharts';
import 'highcharts/highcharts-more';
import HighchartsReact from 'highcharts-react-official';
import { useCallback, useRef, useState } from 'react';
import { EditTodoForm } from '@/components/edit-todo-form';
import { GuestBanner } from '@/components/guest-banner';
import { PageLoader } from '@/components/page-loader';
import { useTheme } from '@/components/theme-provider';
import { TodoListPanel } from '@/components/todo-list-panel';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useCategories, useTodos } from '@/hooks/use-todos';
import { cn } from '@/lib/utils';
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
  const uncategorized = todos.filter(
    (t) => t.categoryId === null || !knownIds.has(t.categoryId)
  );

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
  const { todos, todosLoading, isGuest, updateMutation, deleteMutation } =
    useTodos();
  const { categories } = useCategories();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const isMobile = useIsMobile();

  const [listPanelOpen, setListPanelOpen] = useState(false);
  const [nestedEditorOpen, setNestedEditorOpen] = useState(false);
  const [selectedTodoId, setSelectedTodoId] = useState<number | null>(null);

  // Store the click handler in a ref so Highcharts callbacks can access it
  const onBubbleClickRef = useRef<(todoId: number) => void>(() => {});
  onBubbleClickRef.current = useCallback((todoId: number) => {
    setListPanelOpen(false);
    setSelectedTodoId(todoId);
  }, []);

  const handleListPanelOpenChange = (open: boolean) => {
    setListPanelOpen(open);
    if (open) setSelectedTodoId(null);
    if (!open) setNestedEditorOpen(false);
  };

  const activeTodos = todos.filter(
    (t) => (t.progress ?? 0) < (t.effort ?? EFFORT_RANGE[0])
  );

  const selectedTodo =
    selectedTodoId != null
      ? todos.find((t) => t.id === selectedTodoId) ?? null
      : null;

  const textColor = isDark ? '#f5f5f5' : '#171717';
  const mutedColor = isDark ? '#a3a3a3' : '#737373';
  const tooltipBg = isDark ? '#262626' : '#ffffff';
  const tooltipBorder = isDark ? '#404040' : '#e5e5e5';

  const options: Highcharts.Options = {
    chart: {
      type: 'packedbubble',
      height: '80%',
      backgroundColor: 'transparent',
      style: {
        fontFamily: 'Inter, Geist, ui-sans-serif, system-ui, sans-serif',
      },
    },
    title: {
      text: "What's in my mind",
      style: { color: textColor, fontWeight: '600' },
    },
    subtitle: {
      text: 'Grouped by category. Bubble size reflects effort.',
      style: { color: mutedColor },
    },
    tooltip: {
      pointFormat: '<b>{point.name}</b><br/>Effort: {point.value}',
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      style: { color: textColor },
    },
    legend: {
      itemStyle: { color: textColor, fontWeight: 'normal' },
      itemHoverStyle: { color: textColor },
    },
    plotOptions: {
      packedbubble: {
        minSize: isMobile ? 28 : 40,
        maxSize: isMobile ? 70 : 100,
        marker: {
          fillOpacity: 0.5,
        },
        dataLabels: {
          enabled: true,
          format: '{point.name}',
          style: {
            color: isDark ? '#e5e5e5' : '#171717',
            fontSize: '11px',
            textOutline: 'none',
            fontWeight: 'normal',
          },
        },
        point: {
          events: {
            click: function () {
              const todoId = (this as unknown as Record<string, unknown>)
                .todoId as number | undefined;
              if (todoId != null) {
                onBubbleClickRef.current(todoId);
              }
            },
          },
        },
      },
    },
    series: buildSeries(
      activeTodos,
      categories
    ) as Highcharts.SeriesOptionsType[],
    credits: { enabled: false },
  };

  return (
    <div className='mx-auto w-full max-w-4xl space-y-6 px-4 py-10'>
      {isGuest && <GuestBanner />}

      {todosLoading ? (
        <PageLoader size='lg' />
      ) : activeTodos.length === 0 ? (
        <p className='py-8 text-center text-muted-foreground'>No tasks yet.</p>
      ) : (
        <HighchartsReact highcharts={Highcharts} options={options} />
      )}

      <div className='flex justify-center'>
        {/* List panel drawer */}
        <Drawer
          modal={false}
          direction='right'
          open={listPanelOpen}
          onOpenChange={handleListPanelOpenChange}
        >
          <DrawerTrigger asChild>
            <Button variant='secondary'>Show item editor panel</Button>
          </DrawerTrigger>
          <DrawerContent
            className={cn(
              'data-[vaul-drawer-direction=right]:w-72 transition-transform duration-300 ease-out',
              nestedEditorOpen &&
                'origin-right !-translate-x-5 !scale-[0.97]'
            )}
          >
            <TodoListPanel
              enableNestedEdit
              onNestedEditOpenChange={setNestedEditorOpen}
            />
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant='outline'>Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {/* Standalone edit drawer */}
        <Drawer
          key={selectedTodoId}
          modal={false}
          direction='right'
          open={selectedTodo != null}
          onOpenChange={(open) => {
            if (!open) setSelectedTodoId(null);
          }}
        >
          {selectedTodo && (
            <DrawerContent className='data-[vaul-drawer-direction=right]:w-72'>
              <DrawerHeader className='border-b'>
                <DrawerTitle>Edit Todo</DrawerTitle>
                <DrawerDescription>
                  Update this item's details.
                </DrawerDescription>
              </DrawerHeader>
              <div className='flex-1 overflow-y-auto p-4'>
                <EditTodoForm
                  key={selectedTodo.id}
                  todo={selectedTodo}
                  categories={categories}
                  onUpdate={(data) =>
                    updateMutation.mutate({ id: selectedTodo.id, ...data })
                  }
                  onDelete={() => {
                    deleteMutation.mutate({ id: selectedTodo.id });
                    setSelectedTodoId(null);
                  }}
                  onClose={() => setSelectedTodoId(null)}
                />
              </div>
            </DrawerContent>
          )}
        </Drawer>
      </div>
    </div>
  );
}
