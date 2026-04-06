import { authClient } from '@/lib/auth-client';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AddCategory } from '@/components/add-category';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTodos } from '@/hooks/use-todos';
import { trpc } from '@/utils/trpc';
import { sampleData, sampleCategories } from '@/utils/sampleData';
import type { TableTask } from '@/utils/types';

export const Route = createFileRoute('/table')({
  component: TablePage,
});

function TablePage() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return session ? <TableAuthenticated /> : <TableGuest />;
}

type TodoFormData = {
  text: string;
  importance?: number;
  progress?: number;
  effort?: number;
  deadline?: string | null;
  categoryId?: number | null;
};

function TableAuthenticated() {
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const { todos, createMutation, updateMutation, deleteMutation } = useTodos();
  const { data: categories = [] } = useQuery(trpc.category.getAll.queryOptions());

  return (
    <>
      <TableContent
        todos={(todos.data ?? []) as TableTask[]}
        todosLoading={todos.isLoading}
        categories={categories}
        isGuest={false}
        onAddTodo={(data) => createMutation.mutate(data)}
        onToggleTodo={(id, completed) =>
          updateMutation.mutate({ id, completed: !completed })
        }
        onDeleteTodo={(id) => deleteMutation.mutate({ id })}
        addPending={createMutation.isPending}
        onAddCategory={() => setAddCategoryOpen(true)}
      />
      <AddCategory open={addCategoryOpen} onOpenChange={setAddCategoryOpen} />
    </>
  );
}

function TableGuest() {
  const [todos, setTodos] = useState<TableTask[]>(sampleData);
  const [nextId, setNextId] = useState(
    Math.max(...sampleData.map((t) => t.id)) + 1,
  );

  const handleAddTodo = (data: TodoFormData) => {
    const now = new Date().toISOString();
    setTodos((prev) => [
      ...prev,
      {
        id: nextId,
        text: data.text,
        completed: false,
        importance: data.importance ?? null,
        progress: data.progress ?? 0,
        effort: data.effort ?? null,
        deadline: data.deadline ?? null,
        categoryId: data.categoryId ?? null,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    setNextId((prev) => prev + 1);
  };

  return (
    <TableContent
      todos={todos}
      todosLoading={false}
      categories={sampleCategories}
      isGuest
      onAddTodo={handleAddTodo}
      onToggleTodo={(id, completed) =>
        setTodos((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, completed: !completed } : t,
          ),
        )
      }
      onDeleteTodo={(id) =>
        setTodos((prev) => prev.filter((t) => t.id !== id))
      }
      addPending={false}
    />
  );
}

interface TableContentProps {
  todos: TableTask[];
  todosLoading: boolean;
  categories: { id: number; name: string; color: string | null }[];
  isGuest: boolean;
  onAddTodo: (data: TodoFormData) => void;
  onToggleTodo: (id: number, completed: boolean) => void;
  onDeleteTodo: (id: number) => void;
  addPending: boolean;
  onAddCategory?: () => void;
}

function TableContent({
  todos,
  todosLoading,
  categories,
  isGuest,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
  addPending,
  onAddCategory,
}: TableContentProps) {
  const [newTodoText, setNewTodoText] = useState('');
  const [newImportance, setNewImportance] = useState('3');
  const [newProgress, setNewProgress] = useState('0');
  const [newEffort, setNewEffort] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newCategoryId, setNewCategoryId] = useState<number | undefined>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;

    const importance = Number.parseInt(newImportance);
    const progress = Number.parseInt(newProgress);
    const effort = Number.parseInt(newEffort);

    onAddTodo({
      text: newTodoText,
      importance: Number.isNaN(importance) ? undefined : importance,
      progress: Number.isNaN(progress) ? undefined : progress,
      effort: Number.isNaN(effort) ? undefined : effort,
      deadline: newDeadline ? new Date(newDeadline).toISOString() : null,
      categoryId: newCategoryId ?? null,
    });

    setNewTodoText('');
    setNewImportance('3');
    setNewProgress('0');
    setNewEffort('');
    setNewDeadline('');
    setNewCategoryId(undefined);
  };

  const getImportanceLabel = (importance?: number | null) => {
    if (!importance) return '';
    const labels = ['', '⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'];
    return labels[importance] || '';
  };

  return (
    <div className="mx-auto w-full max-w-4xl py-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Rich Todo List</CardTitle>
          <CardDescription>
            Manage your tasks with importance and progress tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isGuest && (
            <div className="mb-4 rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
              This is a demo with sample data.{' '}
              <Link
                to="/auth/$path"
                params={{ path: 'sign-in' }}
                className="font-medium underline underline-offset-4 hover:text-primary"
              >
                Sign in
              </Link>{' '}
              to save your work.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mb-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="text">Task *</Label>
                <Input
                  id="text"
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  placeholder="Enter task description..."
                  disabled={addPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="importance">Importance (1-5)</Label>
                <Input
                  id="importance"
                  type="number"
                  min="1"
                  max="5"
                  value={newImportance}
                  onChange={(e) => setNewImportance(e.target.value)}
                  disabled={addPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="progress">Progress (%)</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={newProgress}
                  onChange={(e) => setNewProgress(e.target.value)}
                  disabled={addPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="effort">Effort</Label>
                <Input
                  id="effort"
                  type="number"
                  min="0"
                  value={newEffort}
                  onChange={(e) => setNewEffort(e.target.value)}
                  placeholder="Estimated effort..."
                  disabled={addPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  disabled={addPending}
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  onValueChange={(value) => {
                    if (value === 'none') {
                      setNewCategoryId(undefined);
                    } else {
                      setNewCategoryId(parseInt(value));
                    }
                  }}
                  value={newCategoryId?.toString() || 'none'}
                  disabled={addPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom" sideOffset={2}>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id.toString()}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor: category.color ?? '#9ca3af',
                            }}
                            aria-hidden="true"
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                    {onAddCategory && (
                      <div className="border-t pt-1 mt-1">
                        <button
                          type="button"
                          className="flex w-full items-center px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            onAddCategory();
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add new category
                        </button>
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              disabled={addPending || !newTodoText.trim()}
              className="w-full"
            >
              {addPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Add Task
            </Button>
          </form>

          {todosLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : todos.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No tasks yet. Create one above!
            </p>
          ) : (
            <div className="space-y-3">
              {todos.map((todo) => (
                <Card key={todo.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={() =>
                          onToggleTodo(todo.id, todo.completed)
                        }
                        id={`todo-${todo.id}`}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-1">
                        <label
                          htmlFor={`todo-${todo.id}`}
                          className={`text-base font-medium cursor-pointer ${
                            todo.completed
                              ? 'line-through text-muted-foreground'
                              : ''
                          }`}
                        >
                          {todo.text}
                        </label>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          {todo.importance && (
                            <span className="inline-flex items-center gap-1">
                              <span className="font-medium">Importance:</span>
                              <span>
                                {getImportanceLabel(todo.importance)}
                              </span>
                            </span>
                          )}
                          {todo.progress !== null &&
                            todo.progress !== undefined && (
                              <span className="inline-flex items-center gap-1">
                                <span className="font-medium">Progress:</span>
                                <span className="px-2 py-0.5 bg-secondary rounded">
                                  {todo.progress}%
                                </span>
                              </span>
                            )}
                          {todo.effort !== null &&
                            todo.effort !== undefined && (
                              <span className="inline-flex items-center gap-1">
                                <span className="font-medium">Effort:</span>
                                <span className="px-2 py-0.5 bg-secondary rounded">
                                  {todo.effort}
                                </span>
                              </span>
                            )}
                          {todo.deadline && (
                            <span className="inline-flex items-center gap-1">
                              <span className="font-medium">Deadline:</span>
                              <span className="px-2 py-0.5 bg-secondary rounded">
                                {new Date(todo.deadline).toLocaleDateString()}
                              </span>
                            </span>
                          )}
                        </div>
                        {todo.createdAt && (
                          <div className="text-xs text-muted-foreground">
                            Created:{' '}
                            {new Date(todo.createdAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteTodo(todo.id)}
                      aria-label="Delete task"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
