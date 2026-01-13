import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { trpc } from '@/utils/trpc';

export const Route = createFileRoute('/todos')({
  component: TodosRoute,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw redirect({
        to: '/login',
      });
    }
  },
});

function TodosRoute() {
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoCategory, setNewTodoCategory] = useState('');
  const [newTodoImportance, setNewTodoImportance] = useState('');
  const [newTodoProgress, setNewTodoProgress] = useState('');

  const todos = useQuery(trpc.todo.getAll.queryOptions());
  const createMutation = useMutation(
    trpc.todo.create.mutationOptions({
      onSuccess: () => {
        todos.refetch();
        setNewTodoText('');
        setNewTodoCategory('');
        setNewTodoImportance('');
        setNewTodoProgress('');
      },
    }),
  );
  const toggleMutation = useMutation(
    trpc.todo.toggle.mutationOptions({
      onSuccess: () => {
        todos.refetch();
      },
    }),
  );
  const deleteMutation = useMutation(
    trpc.todo.delete.mutationOptions({
      onSuccess: () => {
        todos.refetch();
      },
    }),
  );

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodoText.trim()) {
      createMutation.mutate({
        text: newTodoText,
        category: newTodoCategory.trim() ? newTodoCategory.trim() : undefined,
        importance:
          newTodoImportance.trim() === '' ? undefined : Number(newTodoImportance),
        progress:
          newTodoProgress.trim() === '' ? undefined : Number(newTodoProgress),
      });
    }
  };

  const handleToggleTodo = (id: number, completed: boolean) => {
    toggleMutation.mutate({ id, completed: !completed });
  };

  const handleDeleteTodo = (id: number) => {
    deleteMutation.mutate({ id });
  };

  return (
    <div className="mx-auto w-full max-w-md py-10">
      <Card>
        <CardHeader>
          <CardTitle>Todo List</CardTitle>
          <CardDescription>Manage your tasks efficiently</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleAddTodo}
            className="mb-6 grid grid-cols-1 gap-2"
          >
            <div className="flex items-center space-x-2">
              <Input
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                placeholder="Add a new task..."
                disabled={createMutation.isPending}
              />
              <Button
                type="submit"
                disabled={createMutation.isPending || !newTodoText.trim()}
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Add'
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Input
                value={newTodoCategory}
                onChange={(e) => setNewTodoCategory(e.target.value)}
                placeholder="Category (optional)"
                disabled={createMutation.isPending}
              />
              <Input
                value={newTodoImportance}
                onChange={(e) => setNewTodoImportance(e.target.value)}
                placeholder="Importance (optional)"
                inputMode="numeric"
                disabled={createMutation.isPending}
              />
              <Input
                value={newTodoProgress}
                onChange={(e) => setNewTodoProgress(e.target.value)}
                placeholder="Progress (optional)"
                inputMode="numeric"
                disabled={createMutation.isPending}
              />
            </div>
          </form>

          {todos.isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : todos.data?.length === 0 ? (
            <p className="py-4 text-center">No todos yet. Add one above!</p>
          ) : (
            <ul className="space-y-2">
              {todos.data?.map((todo) => (
                <li
                  key={todo.id}
                  className="flex items-center justify-between rounded-md border p-2"
                >
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() =>
                        handleToggleTodo(todo.id, todo.completed)
                      }
                      id={`todo-${todo.id}`}
                    />
                    <label
                      htmlFor={`todo-${todo.id}`}
                      className={`${todo.completed ? 'line-through' : ''}`}
                    >
                      {todo.text}
                    </label>
                    <div className="text-muted-foreground text-xs">
                      {todo.category ? `Category: ${todo.category}` : ''}
                      {typeof todo.importance === 'number'
                        ? `${todo.category ? ' • ' : ''}Importance: ${todo.importance}`
                        : ''}
                      {typeof todo.progress === 'number'
                        ? `${todo.category || typeof todo.importance === 'number' ? ' • ' : ''}Progress: ${todo.progress}`
                        : ''}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteTodo(todo.id)}
                    aria-label="Delete todo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
