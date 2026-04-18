import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCategories } from '@/hooks/use-todos';

interface AddCategoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCategory({ open, onOpenChange }: AddCategoryProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const { createMutation } = useCategories();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate(
      { name: name.trim(), color },
      {
        onSuccess: () => {
          toast.success('Category created successfully!');
          setName('');
          setColor('#6366f1');
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : 'Failed to create category',
          );
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
          <DialogDescription>
            Create a new category to organize your entries.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Category Name *</Label>
            <Input
              id="category-name"
              placeholder="Enter category name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={createMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="color"
                className="h-10 w-16 cursor-pointer rounded p-1"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                disabled={createMutation.isPending}
              />
              <Input
                type="text"
                placeholder="#6366f1"
                className="flex-1"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                disabled={createMutation.isPending}
              />
            </div>
            <p className="text-muted-foreground text-sm">
              Choose a color to identify this category
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || !name.trim()}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Category'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
