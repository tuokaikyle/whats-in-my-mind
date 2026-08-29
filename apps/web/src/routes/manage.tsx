import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Check, CheckCircle2, Ellipsis, Pencil, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EditTodoForm } from '@/components/edit-todo-form';
import { EmptyState } from '@/components/empty-state';
import { GuestBanner } from '@/components/guest-banner';
import { ManageCategory } from '@/components/manage-category';
import { PageLoader } from '@/components/page-loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import * as BaseDrawer from '@/components/ui/drawer-base';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useCategories, useTodos } from '@/hooks/use-todos';
import { highChartColors } from '@/utils/enums';
import { trpc } from '@/utils/trpc';
import type { Category } from '@/utils/types';

export const Route = createFileRoute('/manage')({
  component: ManagePage,
});

function ManagePage() {
  const { categories, isLoading, deleteMutation, createMutation, isGuest } = useCategories();
  const { todos, todosLoading, updateMutation, deleteMutation: deleteTodoMutation } = useTodos();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(highChartColors.Indigo);
  const [editTodoId, setEditTodoId] = useState<number | null>(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());

  const selectedTodo = editTodoId != null ? (todos.find((t) => t.id === editTodoId) ?? null) : null;

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const completedTodos = useMemo(() => {
    return todos
      .filter((todo) => {
        const effort = todo.effort ?? 1;
        const progress = todo.progress ?? 0;
        return effort > 0 && progress >= effort;
      })
      .sort((a, b) => {
        const aDate = new Date(a.completedAt ?? a.updatedAt).getTime();
        const bDate = new Date(b.completedAt ?? b.updatedAt).getTime();
        return bDate - aDate;
      });
  }, [todos]);

  const availableColors = useMemo(() => {
    const usedColors = new Set(categories.map((c) => c.color).filter((c): c is string => c != null));
    return Object.entries(highChartColors).filter(([name, hex]) => name !== 'SteelBlue' && !usedColors.has(hex));
  }, [categories]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    const { id, name } = deleteTarget;
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast.success(`Category "${name}" deleted`);
          setDeleteTarget(null);
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : 'Failed to delete category');
        },
      },
    );
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setCategoryOpen(true);
  };

  const handleCreateCategory = () => {
    const name = newName.trim();
    if (!name) return;

    createMutation.mutate(
      { name, color: newColor },
      {
        onSuccess: () => {
          toast.success('Category created');
          setIsAdding(false);
          setNewName('');
          setNewColor(highChartColors.Indigo);
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : 'Failed to create category');
        },
      },
    );
  };

  const cancelAddingCategory = () => {
    setIsAdding(false);
    setNewName('');
  };

  return (
    <div className='mx-auto w-full max-w-2xl py-10'>
      {isGuest && <GuestBanner />}

      {!isGuest && (
        <Card className='max-sm:rounded-none max-sm:border-0 max-sm:shadow-none'>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Manage your categories for organizing entries.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <PageLoader size='sm' />
            ) : categories.length === 0 ? (
              <EmptyState
                title='No categories yet'
                description='Use the Add Category button below to create one.'
                size='sm'
              />
            ) : (
              <>
                <div className='hidden rounded-md border sm:block'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b bg-muted/50'>
                      <th className='text-left px-4 py-3 text-sm font-medium text-muted-foreground'>Name</th>
                      <th className='text-left px-4 py-3 text-sm font-medium text-muted-foreground'>Color</th>
                      <th className='w-20 px-4 py-3' />
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr key={category.id} className='border-b last:border-b-0'>
                        <td className='px-4 py-3 text-sm'>{category.name}</td>
                        <td className='px-4 py-3'>
                          <div
                            className='h-5 w-5 rounded-full border'
                            style={{
                              backgroundColor: category.color ?? '#6366f1',
                            }}
                          />
                        </td>
                        <td className='px-4 py-3'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-8 w-8'
                                aria-label={`Actions for ${category.name}`}
                              >
                                <Ellipsis className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side='right' align='start'>
                              <DropdownMenuItem onClick={() => openEdit(category)}>
                                <Pencil className='h-4 w-4' />
                                Edit Category
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant='destructive'
                                disabled={deleteMutation.isPending}
                                onClick={() => setDeleteTarget(category)}
                              >
                                <Trash2 className='h-4 w-4' />
                                Delete Category
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
                <div className='divide-y border-y sm:hidden'>
                  {categories.map((category) => (
                    <div key={category.id} className='flex min-h-14 items-center gap-3 px-1 py-2'>
                      <span
                        className='h-5 w-5 shrink-0 rounded-full border'
                        style={{ backgroundColor: category.color ?? '#6366f1' }}
                        aria-hidden='true'
                      />
                      <span className='min-w-0 flex-1 truncate text-sm font-medium'>{category.name}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-11 w-11 shrink-0'
                            aria-label={`Actions for ${category.name}`}
                          >
                            <Ellipsis className='h-5 w-5' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side='bottom' align='end'>
                          <DropdownMenuItem onClick={() => openEdit(category)}>
                            <Pencil className='h-4 w-4' />
                            Edit Category
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant='destructive'
                            disabled={deleteMutation.isPending}
                            onClick={() => setDeleteTarget(category)}
                          >
                            <Trash2 className='h-4 w-4' />
                            Delete Category
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </>
            )}
            {isAdding && (
              <div className='mt-3 space-y-3 rounded-md border bg-muted/20 p-3'>
                <Input
                  autoFocus
                  placeholder='Category name'
                  aria-label='Category name'
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateCategory();
                    if (e.key === 'Escape') cancelAddingCategory();
                  }}
                />
                <fieldset>
                  <legend className='mb-2 text-sm font-medium'>Color</legend>
                  <div className='flex flex-wrap gap-2'>
                    {availableColors.map(([name, hex]) => (
                      <button
                        key={name}
                        type='button'
                        className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition-transform sm:h-8 sm:w-8 ${
                          newColor === hex ? 'scale-105 border-foreground' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: hex }}
                        aria-label={name}
                        aria-pressed={newColor === hex}
                        onClick={() => setNewColor(hex)}
                      >
                        {newColor === hex && <Check className='h-4 w-4 text-white drop-shadow-sm' aria-hidden='true' />}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
                  <Button variant='outline' onClick={cancelAddingCategory}>
                    <X className='h-4 w-4' />
                    Cancel
                  </Button>
                  <Button
                    disabled={!newName.trim() || createMutation.isPending}
                    onClick={handleCreateCategory}
                  >
                    <Check className='h-4 w-4' />
                    {createMutation.isPending ? 'Adding...' : 'Add Category'}
                  </Button>
                </div>
              </div>
            )}
            {!isAdding && (
              <Button
                variant='outline'
                size='sm'
                className='mt-3'
                onClick={() => {
                  setIsAdding(true);
                  setNewName('');
                  setNewColor(availableColors.length > 0 ? availableColors[0][1] : highChartColors.Indigo);
                }}
              >
                Add Category
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card className={`max-sm:rounded-none max-sm:border-0 max-sm:shadow-none ${isGuest ? '' : 'mt-6'}`}>
        <CardHeader>
          <CardTitle>Completed Todos</CardTitle>
          <CardDescription>
            {completedTodos.length === 0
              ? 'Finished tasks will appear here.'
              : `${completedTodos.length} completed ${completedTodos.length === 1 ? 'task' : 'tasks'}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                    <th className='text-left px-4 py-3 text-sm font-medium text-muted-foreground'>Task</th>
                    <th className='text-left px-4 py-3 text-sm font-medium text-muted-foreground'>Category</th>
                    <th className='text-left px-4 py-3 text-sm font-medium text-muted-foreground'>Completed</th>
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
                            <CheckCircle2 className='h-4 w-4 shrink-0 text-green-500' />
                            <span className='truncate text-sm'>{todo.text}</span>
                          </div>
                        </td>
                        <td className='px-4 py-3'>
                          <div className='flex items-center gap-2'>
                            {category ? (
                              <>
                                <div
                                  className='h-5 w-5 shrink-0 rounded-full border'
                                  style={{ backgroundColor: category.color ?? '#6366f1' }}
                                />
                                <span className='truncate text-sm'>{category.name}</span>
                              </>
                            ) : (
                              <span className='text-muted-foreground text-sm'>—</span>
                            )}
                          </div>
                        </td>
                        <td className='px-4 py-3'>
                          <time
                            className='text-sm text-muted-foreground tabular-nums'
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
                            onClick={() => {
                              setEditTodoId(todo.id);
                              setEditDrawerOpen(true);
                            }}
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
                      onClick={() => {
                        setEditTodoId(todo.id);
                        setEditDrawerOpen(true);
                      }}
                    >
                      <CheckCircle2 className='h-5 w-5 shrink-0 text-green-500' aria-hidden='true' />
                      <span className='min-w-0 flex-1'>
                        <span className='block truncate text-sm font-medium'>{todo.text}</span>
                        <span className='mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground'>
                          {category && (
                            <span
                              className='h-2.5 w-2.5 shrink-0 rounded-full border'
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
        </CardContent>
      </Card>

      <Card className='mt-6 max-sm:rounded-none max-sm:border-0 max-sm:shadow-none'>
        <CardHeader>
          <CardTitle>Network Status</CardTitle>
          <CardDescription>Application health check</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center gap-2'>
            <div className={`h-2 w-2 rounded-full ${healthCheck.data ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className='text-muted-foreground text-sm'>
              {healthCheck.isLoading ? 'Checking...' : healthCheck.data ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </CardContent>
      </Card>

      {!isGuest && (
        <ManageCategory
          open={categoryOpen}
          onOpenChange={setCategoryOpen}
          category={editingCategory}
          categories={categories}
        />
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  deleteTodoMutation.mutate({ id: selectedTodo.id });
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
