import { useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import 'highcharts/modules/treemap';
import { useCategories, useTodos } from '@/hooks/use-todos';
import Loader from '@/components/loader';
import type { Category, Task } from '@/utils/types';

export const Route = createFileRoute('/treemap')({
  component: TreemapPage,
});

const UNCATEGORIZED_COLOR = '#9CA3AF';

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

  const loading = todosLoading || categoriesLoading;

  // biome-ignore lint/suspicious/noExplicitAny: Highcharts v12 types are missing some treemap level options
  const options = useMemo<any>(() => {
    const data = buildTreemapData(todos, categories);

    return {
      series: [
        {
          type: 'treemap',
          name: 'Todos by Effort',
          allowTraversingTree: true,
          alternateStartingDirection: true,
          dataLabels: {
            format: '{point.name}',
            style: {
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
                  color: 'var(--highcharts-neutral-color-100, #000)',
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
              },
            },
          ],
          data,
        },
      ],
      title: {
        text: 'Todo Items by Effort',
        align: 'left',
      },
      subtitle: {
        text: 'Grouped by category — rectangle size represents effort',
        align: 'left',
      },
      tooltip: {
        pointFormat: '<b>{point.name}</b><br/>Effort: <b>{point.value}</b>',
      },
    };
  }, [todos, categories]);

  if (loading) {
    return (
      <div className='mx-auto flex w-full max-w-4xl justify-center py-20'>
        <Loader />
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className='mx-auto w-full max-w-4xl py-20 text-center text-muted-foreground'>
        No todo items yet. Add some to see the treemap.
      </div>
    );
  }

  return (
    <div className='mx-auto w-full max-w-4xl px-4 py-10'>
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
        containerProps={{ className: 'w-full' }}
      />
    </div>
  );
}
