import { createFileRoute } from '@tanstack/react-router';
import * as Highcharts from 'highcharts';
import 'highcharts/highcharts-more';
import HighchartsReact from 'highcharts-react-official';
import { useState } from 'react';
import { GuestBanner } from '@/components/guest-banner';
import { PageLoader } from '@/components/page-loader';
import { useTheme } from '@/components/theme-provider';
import { TodoListPanel } from '@/components/todo-list-panel';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
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
      .map((t) => ({ name: t.text, value: t.effort ?? EFFORT_RANGE[0] })),
  }));

  const knownIds = new Set(categories.map((c) => c.id));
  const uncategorized = todos.filter(
    (t) => t.categoryId === null || !knownIds.has(t.categoryId)
  );

  if (uncategorized.length > 0) {
    categorySeries.push({
      name: 'Other',
      color: '#94a3b8',
      data: uncategorized.map((t) => ({
        name: t.text,
        value: t.effort ?? EFFORT_RANGE[0],
      })),
    });
  }

  return categorySeries;
}

function BubblePage() {
  const { todos, todosLoading, isGuest } = useTodos();
  const { categories } = useCategories();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const activeTodos = todos.filter(
    (t) => (t.progress ?? 0) < (t.effort ?? EFFORT_RANGE[0])
  );

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
        minSize: 40,
        maxSize: 100,
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
        <TodoEditorDrawerDemo />
      </div>
    </div>
  );
}

function TodoEditorDrawerDemo() {
  const [editorPanelOpen, setEditorPanelOpen] = useState(false);
  const [nestedEditorOpen, setNestedEditorOpen] = useState(false);

  const handleEditorPanelOpenChange = (open: boolean) => {
    setEditorPanelOpen(open);
    if (!open) setNestedEditorOpen(false);
  };

  return (
    <Drawer
      modal={false}
      direction='right'
      open={editorPanelOpen}
      onOpenChange={handleEditorPanelOpenChange}
    >
      <DrawerTrigger asChild>
        <Button variant='secondary'>Show item editor panel</Button>
      </DrawerTrigger>
      <DrawerContent
        className={cn(
          'data-[vaul-drawer-direction=right]:w-72',
          nestedEditorOpen &&
            'origin-right !-translate-x-5 !scale-[0.97] transition-transform duration-300 ease-out'
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
  );
}
