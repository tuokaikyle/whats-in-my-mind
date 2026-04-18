import { createFileRoute } from '@tanstack/react-router';
import { Check, Circle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AddCategory } from '@/components/add-category';
import { AddTaskDrawer } from '@/components/add-task-drawer';
import { GuestBanner } from '@/components/guest-banner';
import { PageLoader } from '@/components/page-loader';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCategories, useTodos } from '@/hooks/use-todos';

export const Route = createFileRoute('/simple')({
  component: SimplePage,
});

function SimplePage() {
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const {
    todos,
    todosLoading,
    createMutation,
    updateMutation,
    deleteMutation,
    isGuest,
  } = useTodos();
  const { categories } = useCategories();

  return (
    <>
      <div className="mx-auto w-full max-w-md py-10">
        <Card>
          <CardHeader>
            <CardTitle>Todo List</CardTitle>
            <CardDescription>Manage your tasks efficiently</CardDescription>
          </CardHeader>
          <CardContent>
            {isGuest && <GuestBanner className="mb-4" />}

            {todosLoading ? (
              <PageLoader />
            ) : todos.length === 0 ? (
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
                          updateMutation.mutate({
                            id: todo.id,
                            completed: !todo.completed,
                          })
                        }
                        aria-label={
                          todo.completed ? 'Mark incomplete' : 'Mark complete'
                        }
                      >
                        <Circle
                          className={`h-4 w-4 ${todo.completed ? 'fill-green-500 text-green-500' : 'text-green-500'}`}
                        />
                      </Button>
                      <span
                        className={
                          todo.completed
                            ? 'text-muted-foreground line-through'
                            : ''
                        }
                      >
                        {todo.text}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate({ id: todo.id })}
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
