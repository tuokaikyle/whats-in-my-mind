import { Pencil, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { GuestBanner } from '@/components/guest-banner';
import { PageLoader } from '@/components/page-loader';
import { Button } from '@/components/ui/button';
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerNested,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories, useTodos } from '@/hooks/use-todos';
import { EFFORT_RANGE, PROGRESS_RANGE } from '@/utils/enums';
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
  const { todos, todosLoading, createMutation, updateMutation, isGuest } =
    useTodos();
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
    [todos],
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
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="font-semibold text-sm">Todos</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {isGuest && <GuestBanner className="mb-3" />}

        {todosLoading ? (
          <PageLoader />
        ) : (
          <>
            {sortedTodos.length === 0 && !isAdding && (
              <p className="py-4 text-center text-muted-foreground text-sm">
                No todos yet.
              </p>
            )}
            <div className="space-y-1.5">
              {/* Column headers */}
              <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground/60">
                <span className="h-2.5 w-2.5 shrink-0" />
                <span className="min-w-0 flex-1">Name</span>
                <span className="w-10 shrink-0 text-right">Effort</span>
                <span className="w-6 shrink-0" />
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
                />
              ))}
            </div>

            {/* Add form / button — inline below the list */}
            <div className="mt-4 border-t pt-3">
              {isAdding ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="What needs to be done?"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTodo();
                      if (e.key === 'Escape') {
                        setNewText('');
                        setIsAdding(false);
                      }
                    }}
                    autoFocus
                    className="h-8 text-sm"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 shrink-0"
                    onClick={() => {
                      setNewText('');
                      setIsAdding(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 shrink-0"
                    onClick={handleAddTodo}
                    disabled={!newText.trim()}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setIsAdding(true)}
                >
                  <Plus className="mr-1 h-4 w-4" />
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
}) {
  const effort = todo.effort ?? 1;
  const category = categories.find((c) => c.id === todo.categoryId);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(todo.text);
  const [editCategoryId, setEditCategoryId] = useState(
    todo.categoryId?.toString() ?? 'none',
  );
  const [editEffort, setEditEffort] = useState(effort.toString());
  const [editProgress, setEditProgress] = useState(
    (todo.progress ?? 0).toString(),
  );
  const progressOptions = PROGRESS_RANGE.filter(
    (n) => n <= Number.parseInt(editEffort, 10),
  );

  const resetForm = () => {
    setEditName(todo.text);
    setEditCategoryId(todo.categoryId?.toString() ?? 'none');
    setEditEffort((todo.effort ?? 1).toString());
    setEditProgress((todo.progress ?? 0).toString());
  };

  const handleEffortChange = (value: string) => {
    setEditEffort(value);
    setEditProgress((current) =>
      Math.min(
        Number.parseInt(current, 10),
        Number.parseInt(value, 10),
      ).toString(),
    );
  };

  const handleEditOpenChange = (open: boolean) => {
    if (open) resetForm();
    setEditOpen(open);
    onEditOpenChange?.(open);
  };

  const handleSave = () => {
    const text = editName.trim();
    if (!text) return;

    onUpdate({
      text,
      categoryId:
        editCategoryId === 'none' ? null : Number.parseInt(editCategoryId, 10),
      effort: Number.parseInt(editEffort, 10),
      progress: Math.min(
        Number.parseInt(editProgress, 10),
        Number.parseInt(editEffort, 10),
      ),
    });
    setEditOpen(false);
    onEditOpenChange?.(false);
  };

  if (!enableNestedEdit) {
    return (
      <div className="group flex min-h-8 items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50">
        {category ? (
          <div
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: category.color ?? '#6366f1' }}
            title={category.name}
          />
        ) : (
          <div className="h-2.5 w-2.5 shrink-0 rounded-full border border-muted-foreground/40" />
        )}

        <span className="min-w-0 flex-1 truncate text-sm">{todo.text}</span>

        <span className="w-10 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
          {effort}
        </span>

        <div className="flex w-6 shrink-0 items-center justify-end opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => undefined}
            aria-label={`Edit ${todo.text}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DrawerNested
      modal={false}
      direction="right"
      open={editOpen}
      onOpenChange={handleEditOpenChange}
    >
      <div className="group flex min-h-8 items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50">
        {/* Category dot */}
        {category ? (
          <div
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: category.color ?? '#6366f1' }}
            title={category.name}
          />
        ) : (
          <div className="h-2.5 w-2.5 shrink-0 rounded-full border border-muted-foreground/40" />
        )}

        {/* Name */}
        <span className="min-w-0 flex-1 truncate text-sm">{todo.text}</span>

        {/* Effort */}
        <span className="w-10 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
          {effort}
        </span>

        {/* Action placeholder — visible on hover */}
        <div className="flex w-6 shrink-0 items-center justify-end opacity-0 transition-opacity group-hover:opacity-100">
          <DrawerTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              aria-label={`Edit ${todo.text}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </DrawerTrigger>
        </div>
      </div>

      <DrawerContent className="data-[vaul-drawer-direction=right]:w-72">
        <DrawerHeader>
          <DrawerTitle>Edit Todo</DrawerTitle>
          <DrawerDescription>{todo.text}</DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 space-y-4 p-4">
          <div className="space-y-2">
            <Label htmlFor={`todo-name-${todo.id}`}>Name</Label>
            <Input
              id={`todo-name-${todo.id}`}
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={editCategoryId} onValueChange={setEditCategoryId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Effort</Label>
            <Select value={editEffort} onValueChange={handleEffortChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select effort" />
              </SelectTrigger>
              <SelectContent>
                {EFFORT_RANGE.map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`todo-progress-${todo.id}`}>Progress</Label>
            <Select value={editProgress} onValueChange={setEditProgress}>
              <SelectTrigger id={`todo-progress-${todo.id}`} className="w-full">
                <SelectValue placeholder="Select progress" />
              </SelectTrigger>
              <SelectContent>
                {progressOptions.map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DrawerFooter>
          <Button onClick={handleSave} disabled={!editName.trim()}>
            Save
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </DrawerNested>
  );
}
