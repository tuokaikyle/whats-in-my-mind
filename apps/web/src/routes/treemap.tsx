import { createFileRoute } from '@tanstack/react-router';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useMemo, useState } from 'react';
import 'highcharts/modules/treemap';
import Loader from '@/components/loader';
import { useTheme } from '@/components/theme-provider';
import { TodoListPanelDrawer } from '@/components/todo-list-panel-drawer';
import { Button } from '@/components/ui/button';
import * as BaseDrawer from '@/components/ui/drawer-base';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCategories, useTodos } from '@/hooks/use-todos';
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
    const catId =
      key === 'uncategorized'
        ? null
        : Number.parseInt(key.replace('cat-', ''), 10);
    const cat = catId != null ? categoryMap.get(catId) : undefined;
    const name = cat?.name ?? 'Uncategorized';
    const color = group.color;

    // Parent node for this category
    data.push({ id: key, name, color });

    // Leaf nodes: each todo item
    for (const todo of group.todos) {
      data.push({
        name: todo.text,
        parent: key,
        value: todo.effort ?? 0,
        color,
      });
    }
  }

  return data;
}

function TreemapPage() {
  const { todos, todosLoading } = useTodos();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const isMobile = useIsMobile();

  const [listPanelOpen, setListPanelOpen] = useState(false);

  const loading = todosLoading || categoriesLoading;

  const textColor = isDark ? '#f5f5f5' : '#171717';
  const mutedColor = isDark ? '#a3a3a3' : '#737373';
  const tooltipBg = isDark ? '#262626' : '#ffffff';
  const tooltipBorder = isDark ? '#404040' : '#e5e5e5';

  // biome-ignore lint/suspicious/noExplicitAny: Highcharts v12 types are missing some treemap level options
  const options = useMemo<any>(() => {
    const data = buildTreemapData(todos, categories);

    return {
      chart: {
        ...(isMobile ? {} : { height: 600 }),
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
        text: 'Grouped by category — rectangle size represents effort',
        align: 'left',
        style: { color: mutedColor },
      },
      tooltip: {
        pointFormat: '<b>{point.name}</b><br/>Effort: <b>{point.value}</b>',
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        style: { color: textColor },
      },
      credits: { enabled: false },
    };
  }, [
    todos,
    categories,
    isDark,
    isMobile,
    textColor,
    mutedColor,
    tooltipBg,
    tooltipBorder,
  ]);

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-4xl justify-center py-20">
        <Loader />
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="mx-auto w-full max-w-4xl py-20 text-center text-muted-foreground">
        No todo items yet. Add some to see the treemap.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10">
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
        containerProps={{
          className: isMobile ? 'w-full h-[clamp(300px,50vh,600px)]' : 'w-full',
        }}
      />

      <div className="flex justify-center">
        {/* List panel drawer (Base UI) with nested edit drawer.
             No standalone edit drawer here — clicking treemap sections
             drills down the treemap instead of opening an editor. */}
        <BaseDrawer.Drawer
          swipeDirection="right"
          modal={false}
          open={listPanelOpen}
          onOpenChange={setListPanelOpen}
        >
          <BaseDrawer.DrawerTrigger
            render={<Button variant="secondary">Show item editor panel</Button>}
          />
          <BaseDrawer.DrawerContent>
            <BaseDrawer.DrawerHeader>
              <BaseDrawer.DrawerTitle>Todos</BaseDrawer.DrawerTitle>
              <BaseDrawer.DrawerDescription>
                Click an item&apos;s edit icon to open a nested drawer.
              </BaseDrawer.DrawerDescription>
            </BaseDrawer.DrawerHeader>
            <div className="flex-1 overflow-hidden">
              <TodoListPanelDrawer />
            </div>
            <BaseDrawer.DrawerFooter>
              <BaseDrawer.DrawerClose
                render={<Button variant="outline">Close</Button>}
              />
            </BaseDrawer.DrawerFooter>
          </BaseDrawer.DrawerContent>
        </BaseDrawer.Drawer>
      </div>
    </div>
  );
}
