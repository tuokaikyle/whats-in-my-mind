import { Loader2, Pencil, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EditTodoForm } from '@/components/edit-todo-form';
import { GuestBanner } from '@/components/guest-banner';
import { PageLoader } from '@/components/page-loader';
import { Button } from '@/components/ui/button';
import * as BaseDrawer from '@/components/ui/drawer-base';
import { Input } from '@/components/ui/input';
import { useCategories, useTodos } from '@/hooks/use-todos';
import type { Category, Task } from '@/utils/types';

export function TodoListPanelDrawer() {
  const [newText, setNewText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { todos, todosLoading, todoLimit, atTodoLimit, createMutation, isGuest } = useTodos();
  const { categories } = useCategories();

  const sortedTodos = useMemo(
    () =>
      [...todos].sort((a, b) => {
        if (a.categoryId === null && b.categoryId === null) return 0;
        if (a.categoryId === null) return 1;
        if (b.categoryId === null) return -1;
        if (a.categoryId !== b.categoryId) return a.categoryId - b.categoryId;

        // Secondary: completedAt — incomplete (null) first, then oldest completion first.
        if (a.completedAt !== b.completedAt) {
          if (a.completedAt == null) return -1;
          if (b.completedAt == null) return 1;
          return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
        }

        // Tertiary: first character of the text.
        return a.text.charAt(0).localeCompare(b.text.charAt(0));
      }),
    [todos],
  );

  const handleAddTodo = () => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    createMutation.mutate(
      { text: trimmed, progress: 0, effort: 3 },
      {
        onSuccess: () => {
          setNewText('');
          setIsAdding(false);
        },
      },
    );
  };

  return (
    <div className='flex h-full flex-col'>
      <div className='flex items-center justify-between border-b px-4 py-3'>
        <h2 className='font-semibold text-sm'>Todos</h2>
      </div>

      <div className='flex-1 overflow-y-auto px-3 py-3'>
        {isGuest && <GuestBanner className='mb-3' />}

        {todosLoading ? (
          <PageLoader />
        ) : (
          <>
            {sortedTodos.length === 0 && !isAdding && (
              <p className='py-4 text-center text-muted-foreground text-sm'>No todos yet.</p>
            )}
            <div className='space-y-1.5'>
              <div className='flex items-center gap-2 px-2 py-1 text-muted-foreground/60 text-xs'>
                <span className='h-2.5 w-2.5 shrink-0' />
                <span className='min-w-0 flex-1'>Name</span>
                <span className='w-10 shrink-0 text-right'>Effort</span>
                <span className='w-6 shrink-0' />
              </div>
              {sortedTodos.map((todo) => (
                <TodoListItemDrawer key={todo.id} todo={todo} categories={categories} />
              ))}
            </div>

            <div className='mt-4 border-t pt-3'>
              {isAdding ? (
                <div className='flex items-center gap-2'>
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
                    className='h-8 text-sm'
                  />
                  <Button
                    size='sm'
                    variant='ghost'
                    className='h-8 shrink-0'
                    onClick={() => {
                      setNewText('');
                      setIsAdding(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size='sm'
                    className='h-8 shrink-0'
                    onClick={handleAddTodo}
                    disabled={!newText.trim() || createMutation.isPending}
                  >
                    {createMutation.isPending && <Loader2 className='mr-1 h-3.5 w-3.5 animate-spin' />}
                    Add
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    variant='outline'
                    size='sm'
                    className='w-full'
                    onClick={() => setIsAdding(true)}
                    disabled={atTodoLimit}
                  >
                    <Plus className='mr-1 h-4 w-4' />
                    Add item
                  </Button>
                  {atTodoLimit && (
                    <p className='mt-1 text-center text-muted-foreground text-xs'>
                      Limit of {todoLimit} todos reached. Delete one to add another.
                    </p>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TodoListItemDrawer({ todo, categories }: { todo: Task; categories: Category[] }) {
  const { updateMutation, deleteMutation } = useTodos();
  const effort = todo.effort ?? 1;
  const category = categories.find((c) => c.id === todo.categoryId);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <BaseDrawer.Drawer swipeDirection='right' modal={false} open={editOpen} onOpenChange={setEditOpen}>
      <BaseDrawer.DrawerTrigger
        render={
          <button
            type='button'
            className='group flex min-h-8 w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            aria-label={`Edit ${todo.text}`}
          />
        }
      >
        {category ? (
          <span
            className='h-2.5 w-2.5 shrink-0 rounded-full'
            style={{ backgroundColor: category.color ?? '#6366f1' }}
            title={category.name}
          />
        ) : (
          <span className='h-2.5 w-2.5 shrink-0 rounded-full border border-muted-foreground/40' />
        )}

        <span className='min-w-0 flex-1 truncate text-sm'>{todo.text}</span>

        <span className='w-10 shrink-0 text-right text-muted-foreground text-xs tabular-nums'>{effort}</span>

        <span className='flex w-6 shrink-0 items-center justify-end text-muted-foreground opacity-60 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100'>
          <Pencil className='h-3.5 w-3.5' aria-hidden='true' />
        </span>
      </BaseDrawer.DrawerTrigger>

      <BaseDrawer.DrawerContent>
        <BaseDrawer.DrawerHeader>
          <BaseDrawer.DrawerTitle>Edit Todo</BaseDrawer.DrawerTitle>
          <BaseDrawer.DrawerDescription>Update this item&apos;s details.</BaseDrawer.DrawerDescription>
        </BaseDrawer.DrawerHeader>
        <div className='flex-1 overflow-y-auto p-4'>
          <EditTodoForm
            key={todo.id}
            todo={todo}
            categories={categories}
            isUpdating={updateMutation.isPending}
            onUpdate={(data) =>
              updateMutation.mutate(
                { id: todo.id, ...data },
                {
                  onSuccess: () => setEditOpen(false),
                  onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to update todo'),
                },
              )
            }
            onDelete={() => {
              deleteMutation.mutate({ id: todo.id });
              setEditOpen(false);
            }}
            onClose={() => setEditOpen(false)}
          />
        </div>
      </BaseDrawer.DrawerContent>
    </BaseDrawer.Drawer>
  );
}
