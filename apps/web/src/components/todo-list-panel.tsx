import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { GuestBanner } from '@/components/guest-banner';
import { PageLoader } from '@/components/page-loader';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories, useTodos } from '@/hooks/use-todos';
import { EFFORT_RANGE } from '@/utils/enums';
import type { Task } from '@/utils/types';

export function TodoListPanel() {
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
    createMutation.mutate({
      text: trimmed,
      progress: 0,
      effort: 3,
    });
    setNewText('');
    setIsAdding(false);
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
                No todos yet. Add one below!
              </p>
            )}
            <div className='space-y-1.5'>
              {/* Column headers */}
              <div className='flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground/60'>
                <span className='h-2.5 w-2.5 shrink-0' />
                <span className='min-w-0 flex-1'>Name</span>
                <span className='w-10 shrink-0 text-right'>Effort</span>
                <span className='w-14 shrink-0' />
              </div>
              {sortedTodos.map((todo) => (
                <TodoListItem
                  key={todo.id}
                  todo={todo}
                  categories={categories}
                  onDelete={() => deleteMutation.mutate({ id: todo.id })}
                  onUpdate={(data) =>
                    updateMutation.mutate({ id: todo.id, ...data })
                  }
                />
              ))}
            </div>

            {/* Add form / button — inline below the list */}
            <div className='mt-3'>
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
                    disabled={!newText.trim()}
                  >
                    Save
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
  onDelete,
  onUpdate,
}: {
  todo: Task;
  categories: { id: number; name: string; color: string | null }[];
  onDelete: () => void;
  onUpdate: (data: {
    text?: string;
    categoryId?: number | null;
    effort?: number;
    progress?: number;
  }) => void;
}) {
  const effort = todo.effort ?? 1;
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState(todo.text);
  const [editEffort, setEditEffort] = useState(effort);

  const category = categories.find((c) => c.id === todo.categoryId);

  const startEditing = () => {
    setEditName(todo.text);
    setEditEffort(effort);
    setEditing(true);
  };

  const saveEdit = () => {
    const trimmed = editName.trim();
    if (!trimmed) return;

    onUpdate({
      text: trimmed,
      effort: editEffort,
    });
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  if (editing) {
    return (
      <div className='flex items-center gap-2 rounded-md border bg-card p-1.5'>
        {/* Name input */}
        <Input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveEdit();
            if (e.key === 'Escape') cancelEdit();
          }}
          className='h-7 flex-1 text-sm'
          autoFocus
        />

        {/* Effort dropdown */}
        <Select
          value={editEffort.toString()}
          onValueChange={(v) => setEditEffort(Number(v))}
        >
          <SelectTrigger className='h-7 w-16 shrink-0 text-xs'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EFFORT_RANGE.map((n) => (
              <SelectItem key={n} value={n.toString()}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Actions */}
        <Button
          variant='ghost'
          size='icon'
          className='h-7 w-7 shrink-0'
          onClick={cancelEdit}
          aria-label='Cancel edit'
        >
          <X className='h-3.5 w-3.5' />
        </Button>
        <Button
          variant='default'
          size='icon'
          className='h-7 w-7 shrink-0'
          onClick={saveEdit}
          disabled={!editName.trim()}
          aria-label='Save edit'
        >
          <Check className='h-3.5 w-3.5' />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className='group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50'>
        {/* Category dot */}
        {category ? (
          <div
            className='h-2.5 w-2.5 shrink-0 rounded-full'
            style={{ backgroundColor: category.color ?? '#6366f1' }}
            title={category.name}
          />
        ) : (
          <div className='h-2.5 w-2.5 shrink-0 rounded-full border border-muted-foreground/40' />
        )}

        {/* Name */}
        <span className='min-w-0 flex-1 truncate text-sm'>{todo.text}</span>

        {/* Effort */}
        <span className='w-10 shrink-0 text-right text-xs text-muted-foreground tabular-nums'>
          {effort}
        </span>

        {/* Actions — visible on hover */}
        <div className='flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity'>
          <Button
            variant='ghost'
            size='icon'
            className='h-6 w-6'
            onClick={startEditing}
            aria-label={`Edit ${todo.text}`}
          >
            <Pencil className='h-3.5 w-3.5' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='h-6 w-6 text-destructive hover:text-destructive'
            onClick={() => setDeleteOpen(true)}
            aria-label={`Delete ${todo.text}`}
          >
            <Trash2 className='h-3.5 w-3.5' />
          </Button>
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Todo</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{todo.text}"? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant='outline'>Cancel</Button>
            </DialogClose>
            <Button
              variant='destructive'
              onClick={() => {
                onDelete();
                setDeleteOpen(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
