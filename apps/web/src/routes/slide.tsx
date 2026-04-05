import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { queryClient, trpc } from '@/utils/trpc';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const LS_KEY = 'whats-in-my-mind';

type Task = {
  id?: number;
  text: string;
  progress: number;
};

export const Route = createFileRoute('/slide')({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const isLoggedIn = !!session;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [submitDone, setSubmitDone] = useState(false);
  const initialized = useRef(false);

  const todosQueryOptions = trpc.todo.getAll.queryOptions();
  const todosQuery = useQuery({ ...todosQueryOptions, enabled: isLoggedIn });

  const createMutation = useMutation(trpc.todo.create.mutationOptions());
  const updateMutation = useMutation(trpc.todo.update.mutationOptions());
  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Non-logged-in: load from localStorage
  useEffect(() => {
    if (sessionPending || isLoggedIn) return;
    const ls = localStorage.getItem(LS_KEY);
    setTasks(ls ? JSON.parse(ls) : []);
  }, [sessionPending, isLoggedIn]);

  // Logged-in: load from DB (once), also check for unsynced local tasks
  useEffect(() => {
    if (!isLoggedIn || !todosQuery.data || initialized.current) return;
    initialized.current = true;
    setTasks(
      todosQuery.data.map((t) => ({ id: t.id, text: t.text, progress: t.progress ?? 0 })),
    );
    const ls = localStorage.getItem(LS_KEY);
    if (ls) setLocalTasks(JSON.parse(ls));
  }, [isLoggedIn, todosQuery.data]);

  const addTask = () => {
    const text = newTaskText.trim();
    if (!text) return;
    setTasks((prev) => [...prev, { text, progress: 0 }]);
    setNewTaskText('');
  };

  const updateProgress = (index: number, progress: number) => {
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, progress } : t)));
  };

  const handleSubmit = async () => {
    if (isLoggedIn) {
      await Promise.all(
        tasks.map((task) =>
          task.id
            ? updateMutation.mutateAsync({ id: task.id, progress: task.progress })
            : createMutation.mutateAsync({ text: task.text, progress: task.progress }),
        ),
      );
      initialized.current = false;
      queryClient.invalidateQueries({ queryKey: todosQueryOptions.queryKey });
    } else {
      localStorage.setItem(LS_KEY, JSON.stringify(tasks));
    }
    setSubmitDone(true);
    setTimeout(() => setSubmitDone(false), 2000);
  };

  const handleSync = async () => {
    await Promise.all(
      localTasks.map((task) =>
        createMutation.mutateAsync({ text: task.text, progress: task.progress }),
      ),
    );
    // Only clear localStorage after all writes succeed
    localStorage.removeItem(LS_KEY);
    setLocalTasks([]);
    initialized.current = false;
    queryClient.invalidateQueries({ queryKey: todosQueryOptions.queryKey });
  };

  const handleDiscard = () => {
    localStorage.removeItem(LS_KEY);
    setLocalTasks([]);
  };

  if (sessionPending || (isLoggedIn && todosQuery.isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-10">
      {isLoggedIn && localTasks.length > 0 && (
        <div className="flex items-center justify-between gap-2 rounded border p-3 text-sm">
          <span>You have {localTasks.length} unsynced local task(s).</span>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSync} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Sync'}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDiscard}>
              Discard
            </Button>
          </div>
        </div>
      )}

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
        <p className="py-4 text-center text-sm text-gray-500">No tasks yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {tasks.map((task, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="w-32 shrink-0 truncate justify-self-end">{task.text}</span>
              <Slider
                value={[task.progress]}
                onValueChange={([v]) => updateProgress(i, v)}
                max={100}
                step={1}
              />
              <span className="w-8 shrink-0 text-right text-gray-500">{task.progress}%</span>
            </div>
          ))}
        </div>
      )}

      {tasks.length > 0 && (
        <Button onClick={handleSubmit} disabled={isSaving} className="mt-2">
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : submitDone ? (
            'Saved!'
          ) : (
            'Submit'
          )}
        </Button>
      )}
    </div>
  );
}
