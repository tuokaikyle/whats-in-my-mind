import { createFileRoute } from '@tanstack/react-router';
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
import { Label } from '@/components/ui/label';
import { useTodos } from '@/hooks/use-todos';

export const Route = createFileRoute('/_authenticated/table')({
  component: RichTodosRoute,
});

function RichTodosRoute() {
  const [newTodoText, setNewTodoText] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newImportance, setNewImportance] = useState('3');
  const [newProgress, setNewProgress] = useState('0');
  const { todos, createMutation, updateMutation, deleteMutation } = useTodos();

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodoText.trim()) {
      const importance = Number.parseInt(newImportance);
      const progress = Number.parseInt(newProgress);
      createMutation.mutate(
        {
          text: newTodoText,
          category: newCategory || undefined,
          importance: Number.isNaN(importance) ? undefined : importance,
          progress: Number.isNaN(progress) ? undefined : progress,
        },
        {
          onSuccess: () => {
            setNewTodoText('');
            setNewCategory('');
            setNewImportance('3');
            setNewProgress('0');
          },
        },
      );
    }
  };

  const handleToggleTodo = (id: number, completed: boolean) => {
    updateMutation.mutate({ id, completed: !completed });
  };

  const handleDeleteTodo = (id: number) => {
    deleteMutation.mutate({ id });
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
            Manage your tasks with categories, importance, and progress tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddTodo} className="mb-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="text">Task *</Label>
                <Input
                  id="text"
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  placeholder="Enter task description..."
                  disabled={createMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g., Work, Personal, Health"
                  disabled={createMutation.isPending}
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
                  disabled={createMutation.isPending}
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
                  disabled={createMutation.isPending}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={createMutation.isPending || !newTodoText.trim()}
              className="w-full"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Add Task
            </Button>
          </form>

          {todos.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : todos.data?.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No tasks yet. Create one above!
            </p>
          ) : (
            <div className="space-y-3">
              {todos.data?.map((todo) => (
                <Card key={todo.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={() =>
                          handleToggleTodo(todo.id, todo.completed)
                        }
                        id={`todo-${todo.id}`}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-1">
                        <label
                          htmlFor={`todo-${todo.id}`}
                          className={`text-base font-medium cursor-pointer ${
                            todo.completed ? 'line-through text-muted-foreground' : ''
                          }`}
                        >
                          {todo.text}
                        </label>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          {todo.category && (
                            <span className="inline-flex items-center gap-1">
                              <span className="font-medium">Category:</span>
                              <span className="px-2 py-0.5 bg-secondary rounded">
                                {todo.category}
                              </span>
                            </span>
                          )}
                          {todo.importance && (
                            <span className="inline-flex items-center gap-1">
                              <span className="font-medium">Importance:</span>
                              <span>{getImportanceLabel(todo.importance)}</span>
                            </span>
                          )}
                          {todo.progress !== null && todo.progress !== undefined && (
                            <span className="inline-flex items-center gap-1">
                              <span className="font-medium">Progress:</span>
                              <span className="px-2 py-0.5 bg-secondary rounded">
                                {todo.progress}%
                              </span>
                            </span>
                          )}
                        </div>
                        {todo.createdAt && (
                          <div className="text-xs text-muted-foreground">
                            Created: {new Date(todo.createdAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTodo(todo.id)}
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
