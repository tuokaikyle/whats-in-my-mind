import { createFileRoute } from '@tanstack/react-router';
import { Reorder, useDragControls } from 'framer-motion';
import { Container, Ellipsis, GripVertical, Loader2, Plus, Tag, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CategorySubMenuContent } from '@/components/category-sub-menu-content';
import { DeleteTodoDialog } from '@/components/delete-todo-dialog';
import { GuestBanner } from '@/components/guest-banner';
import { ManageCategory } from '@/components/manage-category';
import { PageLoader } from '@/components/page-loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useCategories, useTodos } from '@/hooks/use-todos';
import { EFFORT_RANGE } from '@/utils/enums';
import type { Task } from '@/utils/types';

export const Route = createFileRoute('/simple')({
  component: SimplePage,
});

const SIMPLE_ORDER_STEP = 1000;

function compareByCreatedAt(a: Task, b: Task) {
  const createdDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

  if (createdDiff !== 0) return createdDiff;

  return a.id - b.id;
}

function getSimpleOrder(todo: Task) {
  const value = todo.metadata?.simpleOrder;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function getEffectiveOrder(todo: Task, fallbackOrders: Map<number, number>) {
  return getSimpleOrder(todo) ?? fallbackOrders.get(todo.id) ?? todo.id;
}

function sameOrder(a: number[], b: number[]) {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

function getNextSimpleOrder({
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
  const previousOrder = previousTodo ? getEffectiveOrder(previousTodo, fallbackOrders) : null;
  const nextOrder = nextTodo ? getEffectiveOrder(nextTodo, fallbackOrders) : null;

  if (previousOrder !== null && nextOrder !== null) {
    if (nextOrder > previousOrder) return (previousOrder + nextOrder) / 2;
    return (index + 1) * SIMPLE_ORDER_STEP;
  }

  if (previousOrder !== null) return previousOrder + SIMPLE_ORDER_STEP;
  if (nextOrder !== null) return nextOrder - SIMPLE_ORDER_STEP;

  return (index + 1) * SIMPLE_ORDER_STEP;
}

function SimplePage() {
  const [newText, setNewText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { todos, todosLoading, createMutation, updateMutation, deleteMutation, reorderSimpleMutation, isGuest } =
    useTodos();
  const { categories } = useCategories();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const dragStartOrderRef = useRef<number[] | null>(null);
  const orderedIdsRef = useRef<number[]>([]);

  const fallbackOrders = useMemo(() => {
    return new Map(
      [...todos].sort(compareByCreatedAt).map((todo, index) => [todo.id, (index + 1) * SIMPLE_ORDER_STEP]),
    );
  }, [todos]);

  const sortedTodos = useMemo(() => {
    return [...todos].sort((a, b) => {
      const orderDiff = getEffectiveOrder(a, fallbackOrders) - getEffectiveOrder(b, fallbackOrders);

      if (orderDiff !== 0) return orderDiff;

      return compareByCreatedAt(a, b);
    });
  }, [fallbackOrders, todos]);

  const todoById = useMemo(() => new Map(todos.map((todo) => [todo.id, todo])), [todos]);
  const sortedIds = useMemo(() => sortedTodos.map((todo) => todo.id), [sortedTodos]);
  const [orderedIds, setOrderedIds] = useState<number[]>(sortedIds);
  const isReordering = reorderSimpleMutation.isPending;

  useEffect(() => {
    // Don't override the drag-and-drop order while a reorder mutation is in flight
    if (isReordering) return;
    orderedIdsRef.current = sortedIds;
    setOrderedIds(sortedIds);
  }, [sortedIds, isReordering]);

  const setNextOrderedIds = (ids: number[]) => {
    orderedIdsRef.current = ids;
    setOrderedIds(ids);
  };

  const orderedTodos = orderedIds.map((id) => todoById.get(id)).filter((todo): todo is Task => Boolean(todo));

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

  const handleDragStart = () => {
    dragStartOrderRef.current = orderedIdsRef.current;
  };

  const handleDragEnd = (todoId: number) => {
    const startOrder = dragStartOrderRef.current;
    const nextOrder = orderedIdsRef.current;
    dragStartOrderRef.current = null;

    if (!startOrder || sameOrder(startOrder, nextOrder)) return;

    const simpleOrder = getNextSimpleOrder({
      movedId: todoId,
      orderedIds: nextOrder,
      todoById,
      fallbackOrders,
    });

    if (simpleOrder === null) return;

    reorderSimpleMutation.mutate({ id: todoId, simpleOrder });
  };

  return (
    <div className='mx-auto w-full max-w-md py-10'>
      <Card className='max-sm:rounded-none max-sm:border-0 max-sm:shadow-none'>
        <CardHeader>
          <CardTitle>Simple</CardTitle>
          <CardDescription>Manage your tasks efficiently</CardDescription>
        </CardHeader>
        <CardContent>
          {isGuest && <GuestBanner className='mb-4' />}

          {todosLoading ? (
            <PageLoader />
          ) : todos.length === 0 ? (
            <p className='py-4 text-center text-muted-foreground'>No todos yet. Use the + button to add one!</p>
          ) : (
            <Reorder.Group axis='y' values={orderedIds} onReorder={setNextOrderedIds} className='space-y-2'>
              {orderedTodos.map((todo) => (
                <SimpleTodoItem
                  key={todo.id}
                  todo={todo}
                  categories={categories}
                  onAddCategory={() => setCategoryOpen(true)}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
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

function SimpleTodoItem({
  todo,
  categories,
  onAddCategory,
  onDragStart,
  onDragEnd,
  onDelete,
  onEffortChange,
  onProgressChange,
  onCategoryChange,
}: {
  todo: Task;
  categories: { id: number; name: string; color: string | null }[];
  onAddCategory: () => void;
  onDragStart: () => void;
  onDragEnd: (id: number) => void;
  onDelete: () => void;
  onEffortChange: (effort: number) => void;
  onProgressChange: (progress: number) => void;
  onCategoryChange: (categoryId: number | null) => void;
}) {
  const dragControls = useDragControls();
  const effort = todo.effort ?? 1;
  const progress = Math.max(0, Math.min(effort, todo.progress ?? 0));
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <Reorder.Item
      value={todo.id}
      dragControls={dragControls}
      dragListener={false}
      onDragStart={onDragStart}
      onDragEnd={() => onDragEnd(todo.id)}
      className='relative rounded-md border bg-card p-2'
      whileDrag={{ scale: 1.02 }}
    >
      <div className='flex items-center justify-between gap-2'>
        <div className='flex min-w-0 items-center gap-1'>
          <button
            type='button'
            className='-ml-1 flex h-7 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing'
            onPointerDown={(event) => dragControls.start(event)}
            aria-label={`Reorder ${todo.text}`}
          >
            <GripVertical className='h-4 w-4' />
          </button>
          <span className='truncate'>{todo.text}</span>
        </div>
        <div className='flex shrink-0 items-center gap-1'>
          <div className='flex items-center gap-0.5'>
            {Array.from({ length: effort }, (_, i) => {
              const n = i + 1;
              const isFilled = n <= progress;
              return (
                <button
                  key={n}
                  type='button'
                  className={`h-3 w-3 rounded-sm border ${
                    isFilled ? 'border-green-500 bg-green-500' : 'border-muted-foreground/40'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onProgressChange(progress === n ? n - 1 : n);
                  }}
                  aria-label={`Progress ${n}`}
                />
              );
            })}
          </div>
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

      <DeleteTodoDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        todoText={todo.text}
        onDelete={() => {
          onDelete();
          setDeleteOpen(false);
        }}
      />
    </Reorder.Item>
  );
}
