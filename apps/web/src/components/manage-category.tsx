import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
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
import type { Category } from '@/utils/types';
import { highChartColors } from '@/utils/enums';

interface ManageCategoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
}

export function ManageCategory({
  open,
  onOpenChange,
  category,
}: ManageCategoryProps) {
  const isEditing = !!category;
  const [name, setName] = useState('');
  const [color, setColor] = useState(highChartColors.Indigo);
  const { createMutation, updateMutation } = useCategories();

  useEffect(() => {
    if (open) {
      if (category) {
        setName(category.name);
        setColor(category.color ?? highChartColors.Indigo);
      } else {
        setName('');
        setColor(highChartColors.Indigo);
      }
    }
  }, [open, category]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditing && category) {
      updateMutation.mutate(
        { id: category.id, name: name.trim(), color },
        {
          onSuccess: () => {
            toast.success('Category updated successfully!');
            onOpenChange(false);
          },
          onError: (error) => {
            toast.error(
              error instanceof Error
                ? error.message
                : 'Failed to update category'
            );
          },
        }
      );
    } else {
      createMutation.mutate(
        { name: name.trim(), color },
        {
          onSuccess: () => {
            toast.success('Category created successfully!');
            onOpenChange(false);
          },
          onError: (error) => {
            toast.error(
              error instanceof Error
                ? error.message
                : 'Failed to create category'
            );
          },
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Category' : 'Add New Category'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the category name or color.'
              : 'Create a new category to organize your entries.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='category-name'>Category Name *</Label>
            <Input
              id='category-name'
              placeholder='Enter category name...'
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className='space-y-2'>
            <Label>Color</Label>
            <div className='flex flex-wrap gap-2'>
              {Object.entries(highChartColors).map(([colorName, hex]) => {
                const isSelected = color === hex;
                return (
                  <button
                    key={colorName}
                    type='button'
                    className={`relative flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all hover:scale-110 ${
                      isSelected
                        ? 'outline outline-2 outline-offset-2 scale-110'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    style={
                      {
                        backgroundColor: hex,
                        borderColor: hex,
                        ...(isSelected ? { outlineColor: hex } : {}),
                      } as React.CSSProperties
                    }
                    title={colorName}
                    onClick={() => setColor(hex)}
                    disabled={isPending}
                  >
                    {isSelected && (
                      <Check
                        className='h-3 w-3 text-white drop-shadow-sm'
                        strokeWidth={3}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <p className='text-muted-foreground text-sm'>
              Choose a color to identify this category
            </p>
          </div>

          <div className='flex justify-end space-x-2 pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isPending || !name.trim()}>
              {isPending
                ? isEditing
                  ? 'Updating...'
                  : 'Creating...'
                : isEditing
                ? 'Update Category'
                : 'Create Category'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
