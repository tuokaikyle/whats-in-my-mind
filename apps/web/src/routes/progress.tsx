import { createFileRoute } from '@tanstack/react-router';
import { Reorder, useDragControls } from 'framer-motion';
import { Ellipsis, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { GuestBanner } from '@/components/guest-banner';
import { PageLoader } from '@/components/page-loader';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCategories, useTodos } from '@/hooks/use-todos';
import type { Task } from '@/utils/types';

export const Route = createFileRoute('/progress')({
  component: ProgressPage,
});

const PROGRESS_ORDER_STEP = 1000;

function compareByCreatedAt(a: Task, b: Task) {
  const createdDiff =
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  if (createdDiff !== 0) return createdDiff;
  return a.id - b.id;
}

function getProgressOrder(todo: Task) {
  const value = todo.metadata?.simpleOrder;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function getEffectiveOrder(todo: Task, fallbackOrders: Map<number, number>) {
  return getProgressOrder(todo) ?? fallbackOrders.get(todo.id) ?? todo.id;
}

function sameOrder(a: number[], b: number[]) {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

function getNextProgressOrder({
  movedId,
  orderedIds,
  todoById,
  fallbackOrders,
}: {
  movedId: number;
  orderedIds: number[];
  todoById: Map<number, Task>;
  fallbackOrders: Map<number, number>;
}) {
  const index = orderedIds.indexOf(movedId);
  if (index === -1) return null;

  const previousTodo = todoById.get(orderedIds[index - 1]);
  const nextTodo = todoById.get(orderedIds[index + 1]);
  const previousOrder = previousTodo
    ? getEffectiveOrder(previousTodo, fallbackOrders)
    : null;
  const nextOrder = nextTodo
    ? getEffectiveOrder(nextTodo, fallbackOrders)
    : null;

  if (previousOrder !== null && nextOrder !== null) {
    if (nextOrder > previousOrder) return (previousOrder + nextOrder) / 2;
    return (index + 1) * PROGRESS_ORDER_STEP;
  }

  if (previousOrder !== null) return previousOrder + PROGRESS_ORDER_STEP;
  if (nextOrder !== null) return nextOrder - PROGRESS_ORDER_STEP;

  return (index + 1) * PROGRESS_ORDER_STEP;
}

function ProgressPage() {
  const [newText, setNewText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const {
    todos,
    todosLoading,
    createMutation,
    updateMutation,
    deleteMutation,
    reorderSimpleMutation,
    isGuest,
  } = useTodos();
  const { categories } = useCategories();
  const dragStartOrderRef = useRef<number[] | null>(null);
  const orderedIdsRef = useRef<number[]>([]);

  const fallbackOrders = useMemo(() => {
    return new Map(
      [...todos]
        .sort(compareByCreatedAt)
        .map((todo, index) => [todo.id, (index + 1) * PROGRESS_ORDER_STEP])
    );
  }, [todos]);

  const sortedTodos = useMemo(() => {
    return [...todos].sort((a, b) => {
      const orderDiff =
        getEffectiveOrder(a, fallbackOrders) -
        getEffectiveOrder(b, fallbackOrders);
      if (orderDiff !== 0) return orderDiff;
      return compareByCreatedAt(a, b);
    });
  }, [fallbackOrders, todos]);

  const todoById = useMemo(
    () => new Map(todos.map((todo) => [todo.id, todo])),
    [todos]
  );
  const sortedIds = useMemo(
    () => sortedTodos.map((todo) => todo.id),
    [sortedTodos]
  );
  const [orderedIds, setOrderedIds] = useState<number[]>(sortedIds);

  useEffect(() => {
    orderedIdsRef.current = sortedIds;
    setOrderedIds(sortedIds);
  }, [sortedIds]);

  const setNextOrderedIds = (ids: number[]) => {
    orderedIdsRef.current = ids;
    setOrderedIds(ids);
  };

  const orderedTodos = orderedIds
    .map((id) => todoById.get(id))
    .filter((todo): todo is Task => Boolean(todo));

  const handleAddTodo = () => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    createMutation.mutate({
      text: trimmed,
      progress: 0,
      effort: 3,
    });
    setNewText('');
    setIsAdding(false);
  };

  const handleDragStart = () => {
    dragStartOrderRef.current = orderedIdsRef.current;
  };

  const handleDragEnd = (todoId: number) => {
    const startOrder = dragStartOrderRef.current;
    const nextOrder = orderedIdsRef.current;
    dragStartOrderRef.current = null;

    if (!startOrder || sameOrder(startOrder, nextOrder)) return;

    const progressOrder = getNextProgressOrder({
      movedId: todoId,
      orderedIds: nextOrder,
      todoById,
      fallbackOrders,
    });

    if (progressOrder === null) return;

    reorderSimpleMutation.mutate({ id: todoId, simpleOrder: progressOrder });
  };

  return (
    <div className='mx-auto w-full max-w-md py-10'>
      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
          <CardDescription>Track your task progress</CardDescription>
        </CardHeader>
        <CardContent>
          {isGuest && <GuestBanner className='mb-4' />}

          {todosLoading ? (
            <PageLoader />
          ) : todos.length === 0 ? (
            <p className='py-4 text-center text-muted-foreground'>
              No todos yet. Use the + button to add one!
            </p>
          ) : (
            <Reorder.Group
              axis='y'
              values={orderedIds}
              onReorder={setNextOrderedIds}
              className='space-y-2'
            >
              {orderedTodos.map((todo) => (
                <ProgressTodoItem
                  key={todo.id}
                  todo={todo}
                  categories={categories}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDelete={() => deleteMutation.mutate({ id: todo.id })}
                  onEffortChange={(effort) =>
                    updateMutation.mutate({ id: todo.id, effort })
                  }
                  onProgressChange={(progress) =>
                    updateMutation.mutate({ id: todo.id, progress })
                  }
                  onCategoryChange={(categoryId) =>
                    updateMutation.mutate({ id: todo.id, categoryId })
                  }
                />
              ))}
            </Reorder.Group>
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
              <Button
                size='sm'
                onClick={handleAddTodo}
                disabled={!newText.trim()}
              >
                Save
              </Button>
            </div>
          ) : (
            <Button
              variant='ghost'
              size='sm'
              className='mt-2 w-full'
              onClick={() => setIsAdding(true)}
            >
              <Plus className='mr-1 h-4 w-4' />
              Add item
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProgressTodoItem({
  todo,
  categories,
  onDragStart,
  onDragEnd,
  onDelete,
  onEffortChange,
  onProgressChange,
  onCategoryChange,
}: {
  todo: Task;
  categories: { id: number; name: string; color: string | null }[];
  onDragStart: () => void;
  onDragEnd: (id: number) => void;
  onDelete: () => void;
  onEffortChange: (effort: number) => void;
  onProgressChange: (progress: number) => void;
  onCategoryChange: (categoryId: number | null) => void;
}) {
  const dragControls = useDragControls();
  const effort = todo.effort ?? 1;
  const progress = todo.progress ?? 0;
  const steps = Array.from({ length: effort }, (_, i) => i + 1);

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    const step = Math.min(effort, Math.floor(pct * effort) + 1);
    const newProgress = Math.round((step / effort) * 100);
    onProgressChange(newProgress);
  };

  const handleBarKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const step = Math.min(effort, Math.ceil((progress / 100) * effort) + 1);
      onProgressChange(Math.round((step / effort) * 100));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const step = Math.max(0, Math.floor((progress / 100) * effort) - 1);
      onProgressChange(Math.round((step / effort) * 100));
    } else if (e.key === 'Home') {
      e.preventDefault();
      onProgressChange(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      onProgressChange(100);
    }
  };

  return (
    <Reorder.Item
      value={todo.id}
      dragControls={dragControls}
      dragListener={false}
      onDragStart={onDragStart}
      onDragEnd={() => onDragEnd(todo.id)}
      className='relative rounded-md border bg-card p-3'
      whileDrag={{ scale: 1.02 }}
    >
      <div className='flex items-center gap-2'>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className='w-28 shrink-0 cursor-grab select-none truncate text-sm font-medium active:cursor-grabbing'
              onPointerDown={(event) => dragControls.start(event)}
            >
              {todo.text}
            </span>
          </TooltipTrigger>
          <TooltipContent side='top'>{todo.text}</TooltipContent>
        </Tooltip>
        <div
          className='flex h-5 flex-1 cursor-pointer gap-0.5 overflow-hidden rounded-full bg-muted'
          onClick={handleBarClick}
          onKeyDown={handleBarKeyDown}
          role='progressbar'
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${todo.text}: ${progress}%`}
        >
          {steps.map((n) => {
            const stepPct = Math.round((n / effort) * 100);
            const isFilled = progress >= stepPct;
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='h-7 w-7 shrink-0'
              aria-label='More options'
            >
              <Ellipsis className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='start' side='right'>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Set effort</DropdownMenuSubTrigger>
              <DropdownMenuSubContent sideOffset={8}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <DropdownMenuItem key={n} onClick={() => onEffortChange(n)}>
                    {n}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Set category</DropdownMenuSubTrigger>
              <DropdownMenuSubContent sideOffset={8}>
                <DropdownMenuItem onClick={() => onCategoryChange(null)}>
                  None
                </DropdownMenuItem>
                {categories.map((cat) => (
                  <DropdownMenuItem
                    key={cat.id}
                    onClick={() => onCategoryChange(cat.id)}
                  >
                    <div
                      className='mr-2 h-3 w-3 rounded-full border'
                      style={{ backgroundColor: cat.color ?? '#6366f1' }}
                    />
                    {cat.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem variant='destructive' onClick={onDelete}>
              <Trash2 className='h-4 w-4' />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Reorder.Item>
  );
}
