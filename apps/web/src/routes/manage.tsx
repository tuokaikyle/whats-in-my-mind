import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Ellipsis, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { ManageCategory } from '@/components/manage-category';
import { useCategories } from '@/hooks/use-todos';
import type { Category } from '@/utils/types';
import { trpc } from '@/utils/trpc';
import { GuestBanner } from '@/components/guest-banner';

export const Route = createFileRoute('/manage')({
  component: ManagePage,
});

function ManagePage() {
  const { categories, isLoading, deleteMutation, isGuest } = useCategories();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());

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
          toast.error(
            error instanceof Error ? error.message : 'Failed to delete category',
          );
        },
      },
    );
  };

  const openAdd = () => {
    setEditingCategory(undefined);
    setCategoryOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setCategoryOpen(true);
  };

  return (
    <div className="mx-auto w-full max-w-2xl py-10">
      {isGuest && <GuestBanner />}

      {!isGuest && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Categories</CardTitle>
              <CardDescription>
                Manage your categories for organizing entries.
              </CardDescription>
            </div>
            <Button onClick={openAdd}>
              Add Category
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-sm py-4">
                Loading categories...
              </p>
            ) : categories.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">
                No categories yet. Click "Add Category" to create one.
              </p>
            ) : (
              <div className="border rounded-md">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Color
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Name
                      </th>
                      <th className="w-20 px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr key={category.id} className="border-b last:border-b-0">
                        <td className="px-4 py-3">
                          <div
                            className="h-5 w-5 rounded-full border"
                            style={{
                              backgroundColor: category.color ?? '#6366f1',
                            }}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm">{category.name}</td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <Ellipsis className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="right" align="start">
                              <DropdownMenuItem
                                onClick={() => openEdit(category)}
                              >
                                <Pencil className="h-4 w-4" />
                                Edit Category
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                disabled={deleteMutation.isPending}
                                onClick={() => setDeleteTarget(category)}
                              >
                                <Trash2 className="h-4 w-4" />
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
            )}
          </CardContent>
        </Card>
      )}

      <Card className={isGuest ? '' : 'mt-6'}>
        <CardHeader>
          <CardTitle>API Status</CardTitle>
          <CardDescription>Application health check</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                healthCheck.data ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-muted-foreground text-sm">
              {healthCheck.isLoading
                ? 'Checking...'
                : healthCheck.data
                  ? 'Connected'
                  : 'Disconnected'}
            </span>
          </div>
        </CardContent>
      </Card>

      {!isGuest && (
        <ManageCategory
          open={categoryOpen}
          onOpenChange={setCategoryOpen}
          category={editingCategory}
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
            <Button
              variant='outline'
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
