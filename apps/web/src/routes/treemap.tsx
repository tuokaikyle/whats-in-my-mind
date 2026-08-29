import { createFileRoute } from '@tanstack/react-router';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useMemo, useState } from 'react';
import 'highcharts/modules/treemap';
import { EmptyState } from '@/components/empty-state';
import { GuestBanner } from '@/components/guest-banner';
import { PageLoader } from '@/components/page-loader';
import { useTheme } from '@/components/theme-provider';
import { TodoListPanelDrawer } from '@/components/todo-list-panel-drawer';
import { Button } from '@/components/ui/button';
import * as BaseDrawer from '@/components/ui/drawer-base';
import { useCategories, useTodos } from '@/hooks/use-todos';
import { EFFORT_RANGE } from '@/utils/enums';
import type { Category, Task } from '@/utils/types';

export const Route = createFileRoute('/treemap')({
  component: TreemapPage,
});

const UNCATEGORIZED_COLOR = '#6b8abc';

function buildTreemapData(todos: Task[], categories: Category[]) {
  const categoryMap = new Map<number, Category>();
  for (const cat of categories) {
    categoryMap.set(cat.id, cat);
  }

  // Group todos by categoryId
  const grouped = new Map<string, { todos: Task[]; color: string }>();
  for (const todo of todos) {
    const catId = todo.categoryId;
    const key = catId != null ? `cat-${catId}` : 'uncategorized';
    if (!grouped.has(key)) {
      const cat = catId != null ? categoryMap.get(catId) : undefined;
      grouped.set(key, {
        todos: [],
        color: cat?.color || UNCATEGORIZED_COLOR,
      });
    }
    const group = grouped.get(key);
    if (group) {
      group.todos.push(todo);
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: Highcharts v12 treemap data types are restrictive
  const data: any[] = [];

  for (const [key, group] of grouped) {
    const catId = key === 'uncategorized' ? null : Number.parseInt(key.replace('cat-', ''), 10);
    const cat = catId != null ? categoryMap.get(catId) : undefined;
    const name = cat?.name ?? 'Uncategorized';
    const color = group.color;

    // Parent node for this category
    data.push({ id: key, name, color });

    // Leaf nodes: each todo item
    for (const todo of group.todos) {
      const effort = todo.effort ?? EFFORT_RANGE[0];
      data.push({
        name: todo.text,
        parent: key,
        value: effort,
        effort,
        color,
      });
    }
  }

  return data;
}

function TreemapPage() {
  const { todos, todosLoading, isGuest } = useTodos();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [listPanelOpen, setListPanelOpen] = useState(false);

  const loading = todosLoading || categoriesLoading;

  const activeTodos = useMemo(() => todos.filter((t) => (t.progress ?? 0) < (t.effort ?? EFFORT_RANGE[0])), [todos]);

  const textColor = isDark ? '#f5f5f5' : '#171717';
  const mutedColor = isDark ? '#a3a3a3' : '#737373';
  const tooltipBg = isDark ? '#262626' : '#ffffff';
  const tooltipBorder = isDark ? '#404040' : '#e5e5e5';

  // biome-ignore lint/suspicious/noExplicitAny: Highcharts v12 types are missing some treemap level options
  const options = useMemo<any>(() => {
    const data = buildTreemapData(activeTodos, categories);

    return {
      chart: {
        height: null,
        backgroundColor: 'transparent',
        style: {
          fontFamily: 'Inter, Geist, ui-sans-serif, system-ui, sans-serif',
        },
      },
      series: [
        {
          type: 'treemap',
          name: 'Todos by Effort',
          allowTraversingTree: true,
          interactByLeaf: true,
          alternateStartingDirection: true,
          dataLabels: {
            format: '{point.name}',
            style: {
              color: isDark ? '#e5e5e5' : '#171717',
              textOutline: 'none',
            },
          },
          borderRadius: 3,
          nodeSizeBy: 'leaf',
          levels: [
            {
              level: 1,
              layoutAlgorithm: 'sliceAndDice',
              groupPadding: 3,
              dataLabels: {
                headers: true,
                enabled: true,
                style: {
                  fontSize: '0.6em',
                  fontWeight: 'normal',
                  textTransform: 'uppercase',
                  color: isDark ? '#d4d4d4' : '#404040',
                },
              },
              borderRadius: 3,
              borderWidth: 1,
              colorByPoint: true,
            },
            {
              level: 2,
              dataLabels: {
                enabled: true,
                inside: false,
                style: {
                  color: isDark ? '#e5e5e5' : '#171717',
                },
              },
            },
          ],
          data,
        },
      ],
      title: {
        text: 'Tree Map',
        align: 'left',
        style: { color: textColor, fontWeight: '600' },
      },
      subtitle: {
        text: 'Grouped by category — rectangle size reflects relative effort',
        align: 'left',
        style: { color: mutedColor },
      },
      tooltip: {
        headerFormat: '',
        pointFormatter: function (
          this: Highcharts.Point & { effort?: number; node?: { parentNode?: { name?: string } } },
        ) {
          if (this.effort != null) {
            const category = this.node?.parentNode?.name;
            let html = `<b>${this.name}</b>`;
            if (category) {
              html += `<br/>Category: <b>${category}</b>`;
            }
            html += `<br/>Effort: <b>${this.effort}</b>`;
            return html;
          }
          return `<b>${this.name}</b>`;
        },
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        style: { color: textColor },
      },
      credits: { enabled: false },
    };
  }, [activeTodos, categories, isDark, textColor, mutedColor, tooltipBg, tooltipBorder]);

  return (
    <div className='mx-auto w-full max-w-4xl space-y-6 px-4 py-10'>
      {isGuest && <GuestBanner />}

      {loading ? (
        <PageLoader size='lg' />
      ) : activeTodos.length === 0 ? (
        <EmptyState
          title={todos.length === 0 ? 'No todos yet' : 'No tasks in progress'}
          description='Add items in the Simple view to see them here.'
        />
      ) : (
        <HighchartsReact
          highcharts={Highcharts}
          options={options}
          containerProps={{
            className: 'h-[clamp(440px,65dvh,600px)] w-full min-w-0',
          }}
        />
      )}

      <div className='flex justify-center'>
        {/* List panel drawer (Base UI) with nested edit drawer.
             No standalone edit drawer here — clicking treemap sections
             drills down the treemap instead of opening an editor. */}
        <BaseDrawer.Drawer swipeDirection='right' modal={false} open={listPanelOpen} onOpenChange={setListPanelOpen}>
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
      </div>
    </div>
  );
}
