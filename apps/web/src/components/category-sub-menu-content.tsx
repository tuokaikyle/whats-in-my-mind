import { Plus } from 'lucide-react';
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface CategorySubMenuContentProps {
  categories: { id: number; name: string; color: string | null }[];
  selectedCategoryId: number | null;
  onCategoryChange: (categoryId: number | null) => void;
  onAddCategory: () => void;
}

export function CategorySubMenuContent({
  categories,
  selectedCategoryId,
  onCategoryChange,
  onAddCategory,
}: CategorySubMenuContentProps) {
  return (
    <>
      {categories.map((cat) => {
        const isSelected = cat.id === selectedCategoryId;
        return (
          <DropdownMenuItem
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
          >
            <div
              className='mr-2 h-3 w-3 rounded-full border'
              style={{ backgroundColor: cat.color ?? '#6366f1' }}
            />
            {cat.name}
            {isSelected && (
              <span className='ml-auto text-xs text-muted-foreground'>✓</span>
            )}
          </DropdownMenuItem>
        );
      })}
      <DropdownMenuItem onClick={() => onCategoryChange(null)}>
        <div
          className='mr-2 h-3 w-3 rounded-full border'
          style={{ backgroundColor: '#6b8abc' }}
        />
        No category
        {selectedCategoryId === null && (
          <span className='ml-auto text-xs text-muted-foreground'>✓</span>
        )}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={onAddCategory}>
        <Plus className='mr-2 h-4 w-4' />
        Add new
      </DropdownMenuItem>
    </>
  );
}
