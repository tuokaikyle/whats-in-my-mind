import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AddCategory } from '@/components/add-category';
import { useCategories } from '@/hooks/use-todos';
import { trpc } from '@/utils/trpc';
import { GuestBanner } from '@/components/guest-banner';

export const Route = createFileRoute('/manage')({
  component: ManagePage,
});

function ManagePage() {
  const { categories, isLoading, deleteMutation, isGuest } = useCategories();
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());

  const handleDelete = (id: number, name: string) => {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast.success(`Category "${name}" deleted`);
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : 'Failed to delete category',
          );
        },
      },
    );
  };

  if (isGuest) {
    return (
      <div className="mx-auto w-full max-w-2xl py-10">
        <GuestBanner />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl py-10">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Categories</CardTitle>
            <CardDescription>
              Manage your categories for organizing entries.
            </CardDescription>
          </div>
          <Button onClick={() => setAddCategoryOpen(true)}>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          disabled={deleteMutation.isPending}
                          onClick={() =>
                            handleDelete(category.id, category.name)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
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

      <AddCategory
        open={addCategoryOpen}
        onOpenChange={setAddCategoryOpen}
      />
    </div>
  );
}
