import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTodos } from '@/hooks/use-todos';
import { sampleData } from '@/utils/sampleData';
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
  const [newTaskText, setNewTaskText] = useState('');
  const { todos, createMutation, updateMutation } = useTodos();

  const addTask = () => {
    const text = newTaskText.trim();
    if (!text) return;
    createMutation.mutate({ text, progress: 0 });
    setNewTaskText('');
  };

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
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-10">
      <div className="flex gap-2">
        <Input
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
          placeholder="Task name..."
          disabled={createMutation.isPending}
        />
        <Button
          onClick={addTask}
          disabled={!newTaskText.trim() || createMutation.isPending}
        >
          {createMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Add Task'
          )}
        </Button>
      </div>

      {todos.isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">
          No tasks yet.
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
  const [newTaskText, setNewTaskText] = useState('');
  const [nextId, setNextId] = useState(
    Math.max(...sampleData.map((t) => t.id)) + 1,
  );

  const addTask = () => {
    const text = newTaskText.trim();
    if (!text) return;
    setTasks((prev) => [
      ...prev,
      { id: nextId, text, completed: false, progress: 0 },
    ]);
    setNextId((prev) => prev + 1);
    setNewTaskText('');
  };

  const updateProgress = (index: number, progress: number) => {
    setTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, progress } : t)),
    );
  };

  return (
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

      <div className="flex gap-2">
        <Input
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
          placeholder="Task name..."
        />
        <Button onClick={addTask} disabled={!newTaskText.trim()}>
          Add Task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">
          No tasks yet.
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
  );
}
