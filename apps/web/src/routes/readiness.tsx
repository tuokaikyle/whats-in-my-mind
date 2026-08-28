import { createFileRoute } from '@tanstack/react-router';
import { ArrowUpDown, Cog, Loader2, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { GuestBanner } from '@/components/guest-banner';
import { PageLoader } from '@/components/page-loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useTodos } from '@/hooks/use-todos';
import { cn } from '@/lib/utils';
import type { Task } from '@/utils/types';

export const Route = createFileRoute('/readiness')({
  component: ReadinessPage,
});

type SortMode = 'earliest' | 'latest' | 'low-progress' | 'high-progress';

const SORT_LABELS: Record<SortMode, string> = {
  earliest: 'Earliest',
  latest: 'Latest',
  'low-progress': 'Low progress',
  'high-progress': 'High progress',
};

function compareByCreatedAt(a: Task, b: Task) {
  const createdDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  if (createdDiff !== 0) return createdDiff;
  return a.id - b.id;
}

function compareByProgress(a: Task, b: Task) {
  const progressDiff = (a.progress ?? 0) - (b.progress ?? 0);
  if (progressDiff !== 0) return progressDiff;
  return a.id - b.id;
}

function ReadinessPage() {
  const [newText, setNewText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { todos, todosLoading, createMutation, updateMutation, isGuest } = useTodos();
  const [sortMode, setSortMode] = useState<SortMode>('low-progress');

  const sortedTodos = useMemo(() => {
    switch (sortMode) {
      case 'latest':
        return [...todos].sort(compareByCreatedAt).reverse();
      case 'high-progress':
        return [...todos].sort(compareByProgress).reverse();
      case 'earliest':
        return [...todos].sort(compareByCreatedAt);
      default:
        return [...todos].sort(compareByProgress);
    }
  }, [todos, sortMode]);

  const handleAddTodo = () => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    createMutation.mutate(
      {
        text: trimmed,
        progress: 0,
        effort: 3,
      },
      {
        onSuccess: () => {
          setNewText('');
          setIsAdding(false);
        },
      },
    );
  };

  return (
    <div className='mx-auto w-full max-w-md py-10'>
      <Card className='max-sm:rounded-none max-sm:border-0 max-sm:shadow-none'>
        <CardHeader>
          <div className='flex items-center justify-between gap-2'>
            <div>
              <CardTitle>Readiness</CardTitle>
              <CardDescription className='mt-2'>Be ready to start it</CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm' className='shrink-0'>
                  <ArrowUpDown className='mr-1 h-4 w-4' />
                  Sort: {SORT_LABELS[sortMode]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuRadioGroup value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
                  <DropdownMenuRadioItem value='low-progress'>Low progress</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value='high-progress'>High progress</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value='earliest'>Earliest</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value='latest'>Latest</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {isGuest && <GuestBanner className='mb-4' />}

          {todosLoading ? (
            <PageLoader />
          ) : todos.length === 0 ? (
            <EmptyState title='No todos yet' description='Use the + button below to add one.' size='sm' />
          ) : (
            <div className='space-y-2'>
              {sortedTodos.map((todo) => (
                <ReadinessTodoItem
                  key={todo.id}
                  todo={todo}
                  onReadinessChange={(n) =>
                    updateMutation.mutate({
                      id: todo.id,
                      metadata: { ...todo.metadata, readiness: n },
                    })
                  }
                />
              ))}
            </div>
          )}

          {isAdding ? (
            <div className='mt-2 flex items-center gap-2'>
              <Input
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder='What needs to be done?'
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTodo();
                  if (e.key === 'Escape') {
                    setNewText('');
                    setIsAdding(false);
                  }
                }}
                autoFocus
              />
              <Button
                size='sm'
                variant='ghost'
                onClick={() => {
                  setNewText('');
                  setIsAdding(false);
                }}
              >
                Cancel
              </Button>
              <Button size='sm' onClick={handleAddTodo} disabled={!newText.trim() || createMutation.isPending}>
                {createMutation.isPending && <Loader2 className='mr-1 h-3.5 w-3.5 animate-spin' />}
                Add
              </Button>
            </div>
          ) : (
            <Button variant='ghost' size='sm' className='mt-2 w-full' onClick={() => setIsAdding(true)}>
              <Plus className='mr-1 h-4 w-4' />
              Add item
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReadinessTodoItem({
  todo,
  onReadinessChange,
}: {
  todo: Task;
  onReadinessChange: (readiness: 0 | 1 | 2 | 3) => void;
}) {
  // Readiness display: a task already in progress (progress > 0) is fully
  // ready by definition (3/3). Otherwise, fall back to the persisted value
  // in the metadata column. When progress > 0 the dots are non-interactive
  // and the stored metadata value is preserved for if progress resets to 0.
  const effort = todo.effort ?? 1;
  const progress = Math.max(0, Math.min(effort, todo.progress ?? 0));
  const hasProgress = progress > 0;
  const raw = todo.metadata?.readiness;
  const metadataReadiness = typeof raw === 'number' && raw >= 0 && raw <= 3 ? Math.trunc(raw) : 0;
  const level = hasProgress ? 3 : metadataReadiness;

  const handleClick = (n: 1 | 2 | 3) => {
    if (hasProgress) return;
    onReadinessChange(level === n ? 0 : n);
  };

  return (
    <div className='flex items-center gap-2.5 rounded-md border bg-card p-4'>
      <div className='flex shrink-0 items-center gap-1.5'>
        {[1, 2, 3].map((n) => {
          const active = level >= n;
          return (
            <button
              key={n}
              type='button'
              onClick={() => handleClick(n as 1 | 2 | 3)}
              disabled={hasProgress}
              aria-label={`Readiness ${n}`}
              aria-pressed={active}
              className='text-muted-foreground/40 transition-colors hover:text-foreground disabled:cursor-default disabled:hover:text-muted-foreground/40'
            >
              <span
                className={cn(
                  'block h-5 w-5 rounded-full transition-colors',
                  active ? 'bg-green-500' : 'border-2 border-current',
                )}
              />
            </button>
          );
        })}
      </div>
      <span className='text-sm font-medium'>{todo.text}</span>
      <Cog
        className={cn(
          'ml-auto h-5 w-5 shrink-0 text-muted-foreground/50',
          level >= 2 && 'animate-spin',
          level === 3 && 'text-green-500',
        )}
        aria-hidden
      />
    </div>
  );
}
