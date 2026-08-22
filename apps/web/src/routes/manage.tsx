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
              <div className='border rounded-md max-sm:rounded-none'>
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
                              <Button variant='ghost' size='icon' className='h-8 w-8'>
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
                    {isAdding && (
                      <tr className='border-b last:border-b-0 bg-muted/30'>
                        <td className='px-4 py-2'>
                          <Input
                            autoFocus
                            placeholder='Category name'
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newName.trim()) {
                                createMutation.mutate(
                                  { name: newName.trim(), color: newColor },
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
                              }
                              if (e.key === 'Escape') {
                                setIsAdding(false);
                                setNewName('');
                              }
                            }}
                          />
                        </td>
                        <td className='px-4 py-2'>
                          <div className='flex flex-wrap gap-1.5'>
                            {availableColors.map(([name, hex]) => (
                              <button
                                key={name}
                                type='button'
                                className={`h-5 w-5 rounded-full border-2 transition-all ${
                                  newColor === hex
                                    ? 'border-foreground scale-110'
                                    : 'border-transparent hover:scale-105'
                                }`}
                                style={{ backgroundColor: hex }}
                                title={name}
                                onClick={() => setNewColor(hex)}
                              >
                                {newColor === hex && <Check className='h-3 w-3 text-white drop-shadow-sm m-auto' />}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className='px-4 py-2'>
                          <div className='flex items-center gap-1'>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8'
                              disabled={!newName.trim() || createMutation.isPending}
                              onClick={() => {
                                if (!newName.trim()) return;
                                createMutation.mutate(
                                  { name: newName.trim(), color: newColor },
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
                              }}
                            >
                              <Check className='h-4 w-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8'
                              onClick={() => {
                                setIsAdding(false);
                                setNewName('');
                              }}
                            >
                              <X className='h-4 w-4' />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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

      <Card
        className={`max-sm:rounded-none max-sm:border-0 max-sm:shadow-none ${isGuest ? '' : 'mt-6'}`}
      >
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
            <div className='border rounded-md max-sm:rounded-none'>
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
