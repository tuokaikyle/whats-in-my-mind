import { createFileRoute } from '@tanstack/react-router';
import { ArrowUpDown, Container, Ellipsis, Loader2, Plus, Tag, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CategorySubMenuContent } from '@/components/category-sub-menu-content';
import { DeleteTodoDialog } from '@/components/delete-todo-dialog';
import { EmptyState } from '@/components/empty-state';
import { GuestBanner } from '@/components/guest-banner';
import { ManageCategory } from '@/components/manage-category';
import { PageLoader } from '@/components/page-loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCategories, useTodos } from '@/hooks/use-todos';
import { EFFORT_RANGE } from '@/utils/enums';
import type { Task } from '@/utils/types';

export const Route = createFileRoute('/progress')({
  component: ProgressPage,
});

type SortMode = 'earliest' | 'latest' | 'high-effort' | 'low-effort';

const SORT_LABELS: Record<SortMode, string> = {
  earliest: 'Earliest',
  latest: 'Latest',
  'high-effort': 'High effort',
  'low-effort': 'Low effort',
};

function compareByCreatedAt(a: Task, b: Task) {
  const createdDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  if (createdDiff !== 0) return createdDiff;
  return a.id - b.id;
}

function compareByEffort(a: Task, b: Task) {
  const effortDiff = (a.effort ?? EFFORT_RANGE[0]) - (b.effort ?? EFFORT_RANGE[0]);
  if (effortDiff !== 0) return effortDiff;
  return a.id - b.id;
}

function daysBetween(a: Date, b: Date) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const startA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const startB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((startB - startA) / msPerDay);
}

function formatCreatedAgo(createdAt: string) {
  const created = new Date(createdAt);
  const now = new Date();
  const days = daysBetween(created, now);
  if (days <= 0) return 'created today';
  if (days === 1) return 'created yesterday';
  return `created ${days} days ago`;
}

function ProgressPage() {
  const [newText, setNewText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { todos, todosLoading, createMutation, updateMutation, deleteMutation, isGuest } = useTodos();
  const { categories } = useCategories();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('earliest');

  const sortedTodos = useMemo(() => {
    switch (sortMode) {
      case 'latest':
        return [...todos].sort(compareByCreatedAt).reverse();
      case 'high-effort':
        return [...todos].sort(compareByEffort).reverse();
      case 'low-effort':
        return [...todos].sort(compareByEffort);
      default:
        return [...todos].sort(compareByCreatedAt);
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
              <CardTitle>Progress</CardTitle>
              <CardDescription className='mt-2'>At least to start it</CardDescription>
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
                  <DropdownMenuRadioItem value='earliest'>Earliest</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value='latest'>Latest</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value='high-effort'>High effort</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value='low-effort'>Low effort</DropdownMenuRadioItem>
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
                <ProgressTodoItem
                  key={todo.id}
                  todo={todo}
                  categories={categories}
                  onAddCategory={() => setCategoryOpen(true)}
                  onDelete={() => deleteMutation.mutate({ id: todo.id })}
                  onEffortChange={(effort) =>
                    updateMutation.mutate({
                      id: todo.id,
                      effort,
                      progress: Math.min(todo.progress ?? 0, effort),
                    })
                  }
                  onProgressChange={(progress) => updateMutation.mutate({ id: todo.id, progress })}
                  onCategoryChange={(categoryId) => updateMutation.mutate({ id: todo.id, categoryId })}
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

      <ManageCategory open={categoryOpen} onOpenChange={setCategoryOpen} categories={categories} />
    </div>
  );
}

function ProgressTodoItem({
  todo,
  categories,
  onAddCategory,
  onDelete,
  onEffortChange,
  onProgressChange,
  onCategoryChange,
}: {
  todo: Task;
  categories: { id: number; name: string; color: string | null }[];
  onAddCategory: () => void;
  onDelete: () => void;
  onEffortChange: (effort: number) => void;
  onProgressChange: (progress: number) => void;
  onCategoryChange: (categoryId: number | null) => void;
}) {
  const effort = todo.effort ?? 1;
  const progress = Math.max(0, Math.min(effort, todo.progress ?? 0));
  const steps = Array.from({ length: effort }, (_, i) => i + 1);
  const progressPercent = Math.round((progress / effort) * 100);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    const step = Math.min(effort, Math.floor(pct * effort) + 1);
    onProgressChange(step);
  };

  const handleBarKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onProgressChange(Math.min(effort, progress + 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onProgressChange(Math.max(0, progress - 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      onProgressChange(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      onProgressChange(effort);
    }
  };

  return (
    <div className='relative rounded-md border bg-card p-3'>
      <div className='flex items-center justify-between gap-2'>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className='truncate text-sm font-medium'>{todo.text}</span>
          </TooltipTrigger>
          <TooltipContent side='top'>{todo.text}</TooltipContent>
        </Tooltip>
        <div className='flex shrink-0 items-center gap-2'>
          <span className='text-xs text-muted-foreground'>{formatCreatedAgo(todo.createdAt)}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' className='h-7 w-7 shrink-0' aria-label='More options'>
                <Ellipsis className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start' side='right'>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Tag className='mr-2 h-4 w-4' />
                  Category
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent sideOffset={8}>
                  <CategorySubMenuContent
                    categories={categories}
                    selectedCategoryId={todo.categoryId}
                    onCategoryChange={onCategoryChange}
                    onAddCategory={onAddCategory}
                  />
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Container className='mr-2 h-4 w-4' />
                  Effort
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent sideOffset={8}>
                  {EFFORT_RANGE.map((n) => (
                    <DropdownMenuItem key={n} onClick={() => onEffortChange(n)}>
                      {n}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem variant='destructive' onClick={() => setDeleteOpen(true)}>
                <Trash2 className='mr-2 h-4 w-4' />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div
        className='mt-2 flex h-5 w-full cursor-pointer gap-0.5 overflow-hidden rounded-full bg-muted outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
        onClick={handleBarClick}
        onKeyDown={handleBarKeyDown}
        role='slider'
        tabIndex={0}
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={effort}
        aria-valuetext={`${progress} of ${effort} steps complete (${progressPercent}%)`}
        aria-label={`${todo.text} progress`}
      >
        {steps.map((n) => {
          const isFilled = progress >= n;
          return (
            <div
              key={n}
              className={`h-full flex-1 first:rounded-l-full last:rounded-r-full transition-colors duration-200 ${
                isFilled ? 'bg-green-500' : 'bg-muted-foreground/15'
              }`}
            />
          );
        })}
      </div>

      <DeleteTodoDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        todoText={todo.text}
        onDelete={() => {
          onDelete();
          setDeleteOpen(false);
        }}
      />
    </div>
  );
}
