import { authClient } from '@/lib/auth-client';
import { Slider } from '@/components/ui/slider';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTodos } from '@/hooks/use-todos';
import { AddCategory } from '@/components/add-category';
import { AddTaskDrawer, type AddTaskData } from '@/components/add-task-drawer';
import { sampleData, sampleCategories } from '@/utils/sampleData';
import { trpc } from '@/utils/trpc';
import type { SlideTask } from '@/utils/types';

export const Route = createFileRoute('/slide')({
  component: SlidePage,
});

function SlidePage() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return session ? <SlideAuthenticated /> : <SlideGuest />;
}

function SlideAuthenticated() {
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const { todos, createMutation, updateMutation } = useTodos();
  const { data: categories = [] } = useQuery(trpc.category.getAll.queryOptions());

  const updateProgress = (id: number, progress: number) => {
    updateMutation.mutate({ id, progress });
  };

  const tasks: SlideTask[] = (todos.data ?? []).map((t) => ({
    id: t.id,
    text: t.text,
    completed: t.completed,
    progress: t.progress ?? 0,
  }));

  return (
    <>
      <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-10">
        {todos.isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No tasks yet. Use the + button to add one!
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 text-sm">
                <span className="w-32 shrink-0 truncate justify-self-end">
                  {task.text}
                </span>
                <Slider
                  value={[task.progress]}
                  onValueCommit={([v]) => updateProgress(task.id, v)}
                  max={100}
                  step={1}
                />
                <span className="w-8 shrink-0 text-right text-gray-500">
                  {task.progress}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

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

function SlideGuest() {
  const [tasks, setTasks] = useState<SlideTask[]>(
    sampleData.map(({ id, text, completed, progress }) => ({
      id,
      text,
      completed,
      progress,
    })),
  );
  const [nextId, setNextId] = useState(
    Math.max(...sampleData.map((t) => t.id)) + 1,
  );

  const handleAddTask = (data: AddTaskData) => {
    setTasks((prev) => [
      ...prev,
      { id: nextId, text: data.text, completed: false, progress: data.progress ?? 0 },
    ]);
    setNextId((prev) => prev + 1);
  };

  const updateProgress = (index: number, progress: number) => {
    setTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, progress } : t)),
    );
  };

  return (
    <>
      <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-10">
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

        {tasks.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No tasks yet. Use the + button to add one!
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {tasks.map((task, i) => (
              <div key={task.id} className="flex items-center gap-3 text-sm">
                <span className="w-32 shrink-0 truncate justify-self-end">
                  {task.text}
                </span>
                <Slider
                  value={[task.progress]}
                  onValueChange={([v]) => updateProgress(i, v)}
                  max={100}
                  step={1}
                />
                <span className="w-8 shrink-0 text-right text-gray-500">
                  {task.progress}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddTaskDrawer
        categories={sampleCategories}
        onSubmit={handleAddTask}
      />
    </>
  );
}
