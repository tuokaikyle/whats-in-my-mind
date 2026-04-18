import { authClient } from '@/lib/auth-client';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Loader2, Trash2 } from 'lucide-react';
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
import { AddTaskDrawer, type AddTaskData } from '@/components/add-task-drawer';
import { Checkbox } from '@/components/ui/checkbox';
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

function TableAuthenticated() {
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const { todos, createMutation, updateMutation, deleteMutation } = useTodos();
  const { data: categories = [] } = useQuery(trpc.category.getAll.queryOptions());

  return (
    <>
      <TableContent
        todos={(todos.data ?? []) as TableTask[]}
        todosLoading={todos.isLoading}
        isGuest={false}
        onToggleTodo={(id, completed) =>
          updateMutation.mutate({ id, completed: !completed })
        }
        onDeleteTodo={(id) => deleteMutation.mutate({ id })}
      />
      <AddTaskDrawer
        categories={categories}
        onSubmit={(data) => createMutation.mutate(data)}
        isPending={createMutation.isPending}
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

  const handleAddTodo = (data: AddTaskData) => {
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
    <>
      <TableContent
        todos={todos}
        todosLoading={false}
        isGuest
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
      />
      <AddTaskDrawer
        categories={sampleCategories}
        onSubmit={handleAddTodo}
      />
    </>
  );
}

interface TableContentProps {
  todos: TableTask[];
  todosLoading: boolean;
  isGuest: boolean;
  onToggleTodo: (id: number, completed: boolean) => void;
  onDeleteTodo: (id: number) => void;
}

function TableContent({
  todos,
  todosLoading,
  isGuest,
  onToggleTodo,
  onDeleteTodo,
}: TableContentProps) {
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

          {todosLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : todos.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No tasks yet. Use the + button to add one!
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
