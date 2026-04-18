import { authClient } from '@/lib/auth-client';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Check, Circle, Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useTodos } from '@/hooks/use-todos';
import { AddCategory } from '@/components/add-category';
import { AddTaskDrawer, type AddTaskData } from '@/components/add-task-drawer';
import { sampleData, sampleCategories } from '@/utils/sampleData';
import { trpc } from '@/utils/trpc';
import type { SimpleTask } from '@/utils/types';

export const Route = createFileRoute('/simple')({
  component: SimplePage,
});

function SimplePage() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return session ? <SimpleAuthenticated /> : <SimpleGuest />;
}

function SimpleAuthenticated() {
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const { todos, createMutation, updateMutation, deleteMutation } = useTodos();
  const { data: categories = [] } = useQuery(trpc.category.getAll.queryOptions());

  const handleToggleTodo = (id: number, completed: boolean) => {
    updateMutation.mutate({ id, completed: !completed });
  };

  const handleDeleteTodo = (id: number) => {
    deleteMutation.mutate({ id });
  };

  return (
    <>
      <div className="mx-auto w-full max-w-md py-10">
        <Card>
          <CardHeader>
            <CardTitle>Todo List</CardTitle>
            <CardDescription>Manage your tasks efficiently</CardDescription>
          </CardHeader>
          <CardContent>
            {todos.isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : todos.data?.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">
                No todos yet. Use the + button to add one!
              </p>
            ) : (
              <ul className="space-y-2">
                {todos.data?.map((todo) => (
                  <li
                    key={todo.id}
                    className="flex items-center justify-between rounded-md border p-2"
                  >
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => handleToggleTodo(todo.id, todo.completed)}
                        aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
                      >
                        <Check
                          className={`h-4 w-4 ${todo.completed ? 'text-green-500' : 'text-muted-foreground/40'}`}
                        />
                      </Button>
                      <span
                        className={`${todo.completed ? 'line-through text-muted-foreground' : ''}`}
                      >
                        {todo.text}
                      </span>
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

function SimpleGuest() {
  const [todos, setTodos] = useState<SimpleTask[]>(
    sampleData.map(({ id, text, completed }) => ({ id, text, completed })),
  );
  const [nextId, setNextId] = useState(
    Math.max(...sampleData.map((t) => t.id)) + 1,
  );

  const handleAddTodo = (data: AddTaskData) => {
    setTodos((prev) => [
      ...prev,
      { id: nextId, text: data.text, completed: false },
    ]);
    setNextId((prev) => prev + 1);
  };

  return (
    <>
      <div className="mx-auto w-full max-w-md py-10">
        <Card>
          <CardHeader>
            <CardTitle>Todo List</CardTitle>
            <CardDescription>Manage your tasks efficiently</CardDescription>
          </CardHeader>
          <CardContent>
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

            {todos.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">
                No todos yet. Use the + button to add one!
              </p>
            ) : (
              <ul className="space-y-2">
                {todos.map((todo) => (
                  <li
                    key={todo.id}
                    className="flex items-center justify-between rounded-md border p-2"
                  >
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() =>
                          setTodos((prev) =>
                            prev.map((t) =>
                              t.id === todo.id
                                ? { ...t, completed: !t.completed }
                                : t,
                            ),
                          )
                        }
                        aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
                      >
                        <Circle
                          className={`h-4 w-4 ${todo.completed ? 'text-green-500 fill-green-500' : 'text-muted-foreground/40'}`}
                        />
                      </Button>
                      <span
                        className={`${todo.completed ? 'line-through text-muted-foreground' : ''}`}
                      >
                        {todo.text}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setTodos((prev) =>
                          prev.filter((t) => t.id !== todo.id),
                        )
                      }
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

      <AddTaskDrawer
        categories={sampleCategories}
        onSubmit={handleAddTodo}
      />
    </>
  );
}
