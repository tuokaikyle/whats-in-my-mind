import { Loader2, Pencil, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EditTodoForm } from '@/components/edit-todo-form';
import { GuestBanner } from '@/components/guest-banner';
import { PageLoader } from '@/components/page-loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useCategories, useTodos } from '@/hooks/use-todos';
import type { Task } from '@/utils/types';

export function TodoListPanel({
  enableNestedEdit = false,
  onNestedEditOpenChange,
}: {
  enableNestedEdit?: boolean;
  onNestedEditOpenChange?: (open: boolean) => void;
}) {
  const [newText, setNewText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const {
    todos,
    todosLoading,
    createMutation,
    updateMutation,
    deleteMutation,
    isGuest,
  } = useTodos();
  const { categories } = useCategories();

  const sortedTodos = useMemo(
    () =>
      [...todos].sort((a, b) => {
        // null categoryId goes last
        if (a.categoryId === null && b.categoryId === null) return 0;
        if (a.categoryId === null) return 1;
        if (b.categoryId === null) return -1;
        return a.categoryId - b.categoryId;
      }),
    [todos]
  );

  const handleAddTodo = () => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    createMutation.mutate(
      {
        text: trimmed,
        progress: 0,
        effort: 3,
      },
      {
        onSuccess: () => {
          setNewText('');
          setIsAdding(false);
        },
      }
    );
  };

  return (
    <div className='flex h-full flex-col'>
      {/* Header */}
      <div className='flex items-center justify-between border-b px-4 py-3'>
        <h2 className='font-semibold text-sm'>Todos</h2>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto px-3 py-3'>
        {isGuest && <GuestBanner className='mb-3' />}

        {todosLoading ? (
          <PageLoader />
        ) : (
          <>
            {sortedTodos.length === 0 && !isAdding && (
              <p className='py-4 text-center text-muted-foreground text-sm'>
                No todos yet.
              </p>
            )}
            <div className='space-y-1.5'>
              {/* Column headers */}
              <div className='flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground/60'>
                <span className='h-2.5 w-2.5 shrink-0' />
                <span className='min-w-0 flex-1'>Name</span>
                <span className='w-10 shrink-0 text-right'>Effort</span>
                <span className='w-6 shrink-0' />
              </div>
              {sortedTodos.map((todo) => (
                <TodoListItem
                  key={todo.id}
                  todo={todo}
                  categories={categories}
                  enableNestedEdit={enableNestedEdit}
                  onEditOpenChange={onNestedEditOpenChange}
                  onUpdate={(data) =>
                    updateMutation.mutate({ id: todo.id, ...data })
                  }
                  onDelete={() => deleteMutation.mutate({ id: todo.id })}
                />
              ))}
            </div>

            {/* Add form / button — inline below the list */}
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
                    {createMutation.isPending && (
                      <Loader2 className='mr-1 h-3.5 w-3.5 animate-spin' />
                    )}
                    Add
                  </Button>
                </div>
              ) : (
                <Button
                  variant='outline'
                  size='sm'
                  className='w-full'
                  onClick={() => setIsAdding(true)}
                >
                  <Plus className='mr-1 h-4 w-4' />
                  Add item
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TodoListItem({
  todo,
  categories,
  enableNestedEdit,
  onEditOpenChange,
  onUpdate,
  onDelete,
}: {
  todo: Task;
  categories: { id: number; name: string; color: string | null }[];
  enableNestedEdit: boolean;
  onEditOpenChange?: (open: boolean) => void;
  onUpdate: (data: {
    text?: string;
    categoryId?: number | null;
    effort?: number;
    progress?: number;
  }) => void;
  onDelete: () => void;
}) {
  const effort = todo.effort ?? 1;
  const category = categories.find((c) => c.id === todo.categoryId);
  const [editOpen, setEditOpen] = useState(false);

  const handleEditOpenChange = (open: boolean) => {
    setEditOpen(open);
    onEditOpenChange?.(open);
  };

  const handleFormClose = () => handleEditOpenChange(false);
  const handleFormDelete = () => {
    onDelete();
    handleEditOpenChange(false);
  };

  // Extracted Row Content to prevent DRY violation
  const RowContent = (
    <>
      {category ? (
        <div
          className='h-2.5 w-2.5 shrink-0 rounded-full'
          style={{ backgroundColor: category.color ?? '#6366f1' }}
          title={category.name}
        />
      ) : (
        <div className='h-2.5 w-2.5 shrink-0 rounded-full border border-muted-foreground/40' />
      )}

      <span className='min-w-0 flex-1 truncate text-sm'>{todo.text}</span>

      <span className='w-10 shrink-0 text-right text-xs text-muted-foreground tabular-nums'>
        {effort}
      </span>

      <div className='flex w-6 shrink-0 items-center justify-end opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100'>
        {enableNestedEdit ? (
          <SheetTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='h-6 w-6'
              aria-label={`Edit ${todo.text}`}
            >
              <Pencil className='h-3.5 w-3.5' />
            </Button>
          </SheetTrigger>
        ) : (
          <div className='h-6 w-6' />
        )}
      </div>
    </>
  );

  if (!enableNestedEdit) {
    return (
      <div className='group flex min-h-8 items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50'>
        {RowContent}
      </div>
    );
  }

  return (
    <Sheet open={editOpen} onOpenChange={handleEditOpenChange}>
      <div className='group flex min-h-8 items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50'>
        {RowContent}
      </div>

      <SheetContent
        side='right'
        showOverlay={false}
        className='inset-y-3 right-3 h-[calc(100%-1.5rem)] w-72 rounded-xl border p-0 flex flex-col'
        // Prevents clicking outside on the parent drawer from closing both
        onInteractOutside={(e) => e.preventDefault()}
      >
        <SheetHeader className='border-b p-4'>
          <SheetTitle>Edit Todo</SheetTitle>
          <SheetDescription>Update this item's details.</SheetDescription>
        </SheetHeader>
        <div className='flex-1 overflow-y-auto p-4'>
          <EditTodoForm
            todo={todo}
            categories={categories}
            onUpdate={onUpdate}
            onDelete={handleFormDelete}
            onClose={handleFormClose}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
