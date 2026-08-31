import { createFileRoute } from '@tanstack/react-router';
import { Pencil, SquareCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EditTodoForm } from '@/components/edit-todo-form';
import { EmptyState } from '@/components/empty-state';
import { GuestBanner } from '@/components/guest-banner';
import { PageLoader } from '@/components/page-loader';
import { Button } from '@/components/ui/button';
import * as BaseDrawer from '@/components/ui/drawer-base';
import { useCategories, useTodos } from '@/hooks/use-todos';
import { pageMetadata } from '@/utils/page-metadata';

export const Route = createFileRoute('/completed')({
  component: CompletedPage,
});

function CompletedPage() {
  const { todos, todosLoading, updateMutation, deleteMutation, isGuest } = useTodos();
  const { categories } = useCategories();
  const [editTodoId, setEditTodoId] = useState<number | null>(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  const selectedTodo = editTodoId != null ? (todos.find((todo) => todo.id === editTodoId) ?? null) : null;
  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const completedTodos = useMemo(
    () =>
      todos
        .filter((todo) => {
          const effort = todo.effort ?? 1;
          const progress = todo.progress ?? 0;
          return effort > 0 && progress >= effort;
        })
        .sort((a, b) => {
          const aDate = new Date(a.completedAt ?? a.updatedAt).getTime();
          const bDate = new Date(b.completedAt ?? b.updatedAt).getTime();
          return bDate - aDate;
        }),
    [todos],
  );

  const openEditor = (todoId: number) => {
    setEditTodoId(todoId);
    setEditDrawerOpen(true);
  };

  return (
    <div className='mx-auto w-full max-w-2xl px-4 py-10'>
      {isGuest && <GuestBanner />}

      <section>
        <header className='mb-6 space-y-1.5'>
          <h1 className='flex items-center gap-1.5 text-2xl font-semibold tracking-tight'>
            {pageMetadata.completed.title}
          </h1>
          <p className='text-sm text-muted-foreground'>
            {todosLoading
              ? pageMetadata.completed.description
              : `${completedTodos.length} completed ${completedTodos.length === 1 ? 'task' : 'tasks'}.`}
          </p>
        </header>

        {todosLoading ? (
          <PageLoader size='sm' />
        ) : completedTodos.length === 0 ? (
          <EmptyState title='No completed todos yet' description='Finished tasks will appear here.' size='sm' />
        ) : (
          <>
            <div className='hidden rounded-md border sm:block'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b bg-muted/50'>
                    <th className='px-4 py-3 text-left text-sm font-medium text-muted-foreground'>Task</th>
                    <th className='px-4 py-3 text-left text-sm font-medium text-muted-foreground'>Category</th>
                    <th className='px-4 py-3 text-left text-sm font-medium text-muted-foreground'>Completed</th>
                    <th className='w-12 px-4 py-3' />
                  </tr>
                </thead>
                <tbody>
                  {completedTodos.map((todo) => {
                    const category = todo.categoryId != null ? categoryById.get(todo.categoryId) : undefined;
                    const completedDate = new Date(todo.completedAt ?? todo.updatedAt);
                    return (
                      <tr key={todo.id} className='border-b last:border-b-0'>
                        <td className='px-4 py-3'>
                          <div className='flex items-center gap-2'>
                            <SquareCheck className='h-4 w-4 shrink-0 text-green-500' />
                            <span className='truncate text-sm'>{todo.text}</span>
                          </div>
                        </td>
                        <td className='px-4 py-3'>
                          <div className='flex items-center gap-2'>
                            {category ? (
                              <>
                                <div
                                  className='h-3 w-3 shrink-0 rounded-full'
                                  style={{ backgroundColor: category.color ?? '#6366f1' }}
                                />
                                <span className='truncate text-sm'>{category.name}</span>
                              </>
                            ) : (
                              <span className='text-sm text-muted-foreground'>—</span>
                            )}
                          </div>
                        </td>
                        <td className='px-4 py-3'>
                          <time
                            className='text-sm tabular-nums text-muted-foreground'
                            dateTime={completedDate.toISOString()}
                          >
                            {completedDate.toLocaleDateString()}
                          </time>
                        </td>
                        <td className='px-4 py-3'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8 shrink-0'
                            aria-label={`Edit ${todo.text}`}
                            onClick={() => openEditor(todo.id)}
                          >
                            <Pencil className='h-4 w-4' />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className='divide-y border-y sm:hidden'>
              {completedTodos.map((todo) => {
                const category = todo.categoryId != null ? categoryById.get(todo.categoryId) : undefined;
                const completedDate = new Date(todo.completedAt ?? todo.updatedAt);
                return (
                  <button
                    key={todo.id}
                    type='button'
                    className='flex min-h-16 w-full items-center gap-3 px-1 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    aria-label={`Edit ${todo.text}`}
                    onClick={() => openEditor(todo.id)}
                  >
                    <SquareCheck className='h-5 w-5 shrink-0 text-green-500' aria-hidden='true' />
                    <span className='min-w-0 flex-1'>
                      <span className='block truncate text-sm font-medium'>{todo.text}</span>
                      <span className='mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground'>
                        {category && (
                          <span
                            className='h-2 w-2 shrink-0 rounded-full'
                            style={{ backgroundColor: category.color ?? '#6366f1' }}
                            aria-hidden='true'
                          />
                        )}
                        <span className='truncate'>{category?.name ?? 'Uncategorized'}</span>
                        <span aria-hidden='true'>·</span>
                        <time className='shrink-0 tabular-nums' dateTime={completedDate.toISOString()}>
                          {completedDate.toLocaleDateString()}
                        </time>
                      </span>
                    </span>
                    <Pencil className='h-4 w-4 shrink-0 text-muted-foreground' aria-hidden='true' />
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>

      <BaseDrawer.Drawer
        swipeDirection='right'
        modal={false}
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        onOpenChangeComplete={(open) => {
          if (!open) setEditTodoId(null);
        }}
      >
        {selectedTodo && (
          <BaseDrawer.DrawerContent>
            <BaseDrawer.DrawerHeader className='border-b'>
              <BaseDrawer.DrawerTitle>Edit Todo</BaseDrawer.DrawerTitle>
              <BaseDrawer.DrawerDescription>Update this item&apos;s details.</BaseDrawer.DrawerDescription>
            </BaseDrawer.DrawerHeader>
            <div className='flex-1 overflow-y-auto p-4'>
              <EditTodoForm
                key={selectedTodo.id}
                todo={selectedTodo}
                categories={categories}
                isUpdating={updateMutation.isPending}
                onUpdate={(data) =>
                  updateMutation.mutate(
                    { id: selectedTodo.id, ...data },
                    {
                      onSuccess: () => setEditDrawerOpen(false),
                      onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to update todo'),
                    },
                  )
                }
                onDelete={() => {
                  deleteMutation.mutate({ id: selectedTodo.id });
                  setEditDrawerOpen(false);
                }}
                onClose={() => setEditDrawerOpen(false)}
              />
            </div>
          </BaseDrawer.DrawerContent>
        )}
      </BaseDrawer.Drawer>
    </div>
  );
}
