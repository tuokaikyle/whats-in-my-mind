import { DeleteAccountCard } from '@daveyplate/better-auth-ui';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Check, Ellipsis, Pencil, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/empty-state';
import { GuestBanner } from '@/components/guest-banner';
import { ManageCategory } from '@/components/manage-category';
import { ModeToggle } from '@/components/mode-toggle';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useCategories } from '@/hooks/use-todos';
import { highChartColors } from '@/utils/enums';
import { trpc } from '@/utils/trpc';
import type { Category } from '@/utils/types';

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  const { categories, isLoading, deleteMutation, createMutation, isGuest } = useCategories();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(highChartColors.Indigo);
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());

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
    <div className='mx-auto w-full max-w-2xl px-4 py-10'>
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
                  <Button disabled={!newName.trim() || createMutation.isPending} onClick={handleCreateCategory}>
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
        <CardHeader className='flex flex-row items-center justify-between gap-4'>
          <div className='space-y-1.5'>
            <CardTitle>Theme</CardTitle>
            <CardDescription>Choose a light, dark, or system theme.</CardDescription>
          </div>
          <ModeToggle />
        </CardHeader>
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
        <section className='mt-6' aria-label='Danger zone'>
          <DeleteAccountCard
            className='border-border max-sm:rounded-none max-sm:shadow-none'
            classNames={{
              title: '!text-base md:!text-base',
              footer: 'border-border bg-muted/30',
              destructiveButton: 'border border-border !bg-transparent !text-destructive shadow-none hover:!bg-muted',
            }}
          />
        </section>
      )}

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
    </div>
  );
}
