import { authClient } from '@/lib/auth-client';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import HighchartsReact from 'highcharts-react-official';
import * as Highcharts from 'highcharts';
import 'highcharts/highcharts-more';
import { useTheme } from '@/components/theme-provider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AddCategory } from '@/components/add-category';
import { AddTaskDrawer, type AddTaskData } from '@/components/add-task-drawer';
import { useTodos } from '@/hooks/use-todos';
import { trpc } from '@/utils/trpc';
import { sampleData, sampleCategories } from '@/utils/sampleData';
import type { TableTask } from '@/utils/types';

export const Route = createFileRoute('/bubble')({
  component: BubblePage,
});

type Metric = 'importance' | 'effort';
type CategoryItem = { id: number; name: string; color: string | null };

// ─── Page router ─────────────────────────────────────────────────────────────

function BubblePage() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return session ? <BubbleAuthenticated /> : <BubbleGuest />;
}

// ─── Authenticated ────────────────────────────────────────────────────────────

function BubbleAuthenticated() {
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const { todos, createMutation } = useTodos();
  const { data: categories = [] } = useQuery(trpc.category.getAll.queryOptions());

  return (
    <>
      <BubbleView
        todos={(todos.data ?? []) as TableTask[]}
        todosLoading={todos.isLoading}
        categories={categories}
        isGuest={false}
      />
      <AddTaskDrawer
        categories={categories}
        onSubmit={(data) => createMutation.mutate(data)}
        isPending={createMutation.isPending}
        onAddCategory={() => setAddCategoryOpen(true)}
      />
      <AddCategory open={addCategoryOpen} onOpenChange={setAddCategoryOpen} />
    </>
  );
}

// ─── Guest ────────────────────────────────────────────────────────────────────

function BubbleGuest() {
  const [todos, setTodos] = useState<TableTask[]>(sampleData);
  const [nextId, setNextId] = useState(
    Math.max(...sampleData.map((t) => t.id)) + 1,
  );

  const handleAddTodo = (data: AddTaskData) => {
    const now = new Date().toISOString();
    setTodos((prev) => [
      ...prev,
      {
        id: nextId,
        text: data.text,
        completed: false,
        importance: data.importance ?? null,
        effort: data.effort ?? null,
        progress: data.progress ?? 0,
        deadline: data.deadline ?? null,
        categoryId: data.categoryId ?? null,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    setNextId((prev) => prev + 1);
  };

  return (
    <>
      <BubbleView
        todos={todos}
        todosLoading={false}
        categories={sampleCategories}
        isGuest
      />
      <AddTaskDrawer
        categories={sampleCategories}
        onSubmit={handleAddTodo}
      />
    </>
  );
}

// ─── Shared view ──────────────────────────────────────────────────────────────

interface BubbleViewProps {
  todos: TableTask[];
  todosLoading: boolean;
  categories: CategoryItem[];
  isGuest: boolean;
}

function buildSeries(todos: TableTask[], categories: CategoryItem[], metric: Metric) {
  const getValue = (t: TableTask) =>
    (metric === 'importance' ? t.importance : t.effort) ?? 1;

  const categorySeries = categories.map((category) => ({
    name: category.name,
    color: category.color ?? undefined,
    data: todos
      .filter((t) => t.categoryId === category.id)
      .map((t) => ({ name: t.text, value: getValue(t) })),
  }));

  const knownIds = new Set(categories.map((c) => c.id));
  const uncategorized = todos.filter(
    (t) => t.categoryId === null || !knownIds.has(t.categoryId),
  );

  if (uncategorized.length > 0) {
    categorySeries.push({
      name: 'Other',
      color: '#94a3b8',
      data: uncategorized.map((t) => ({ name: t.text, value: getValue(t) })),
    });
  }

  return categorySeries;
}

function BubbleView({ todos, todosLoading, categories, isGuest }: BubbleViewProps) {
  const [metric, setMetric] = useState<Metric>('importance');
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const activeTodos = todos.filter((t) => !t.completed);

  const textColor = isDark ? '#f5f5f5' : '#171717';
  const mutedColor = isDark ? '#a3a3a3' : '#737373';
  const tooltipBg = isDark ? '#262626' : '#ffffff';
  const tooltipBorder = isDark ? '#404040' : '#e5e5e5';

  const options: Highcharts.Options = {
    chart: {
      type: 'packedbubble',
      height: '80%',
      backgroundColor: 'transparent',
      style: { fontFamily: 'Inter, Geist, ui-sans-serif, system-ui, sans-serif' },
    },
    title: {
      text: "What's in my mind",
      style: { color: textColor, fontWeight: '600' },
    },
    subtitle: {
      text: `Grouped by category — bubble size reflects ${metric}`,
      style: { color: mutedColor },
    },
    tooltip: {
      pointFormat: `<b>{point.name}</b><br/>${metric === 'importance' ? 'Importance' : 'Effort'}: {point.value}`,
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
        minSize: 20,
        dataLabels: {
          enabled: true,
          format: '{point.name}',
          style: {
            color: 'white',
            textOutline: 'none',
            fontWeight: 'normal',
          },
        },
      },
    },
    series: buildSeries(activeTodos, categories, metric) as Highcharts.SeriesOptionsType[],
    credits: { enabled: false },
  };

  return (
    <div className="mx-auto w-full max-w-3xl py-10 px-4 space-y-6">
      {isGuest && (
        <div className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
          This is a demo with sample data.{' '}
          <Link
            to="/auth/$path"
            params={{ path: 'sign-in' }}
            className="font-medium underline underline-offset-4 hover:text-primary"
          >
            Sign in
          </Link>{' '}
          to save your work.
        </div>
      )}

      {todosLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : activeTodos.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          No tasks yet. Use the + button to add one!
        </p>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Bubble size:</span>
            <Select value={metric} onValueChange={(v) => setMetric(v as Metric)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="importance">Importance</SelectItem>
                <SelectItem value="effort">Effort</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <HighchartsReact highcharts={Highcharts} options={options} />
        </>
      )}
    </div>
  );
}
