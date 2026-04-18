import { authClient } from '@/lib/auth-client';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Loader2, MoreHorizontal } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

  const columns = useMemo<ColumnDef<TableTask>[]>(
    () => [
      {
        accessorKey: 'text',
        header: 'Task',
        cell: ({ row }) => {
          const todo = row.original;
          return (
            <span
              className={
                todo.completed ? 'line-through text-muted-foreground' : 'font-medium'
              }
            >
              {todo.text}
            </span>
          );
        },
      },
      {
        accessorKey: 'completed',
        header: 'Status',
        cell: ({ row }) =>
          row.original.completed ? (
            <span className="text-xs font-medium text-emerald-600">Completed</span>
          ) : (
            <span className="text-xs text-muted-foreground">Active</span>
          ),
      },
      {
        accessorKey: 'importance',
        header: 'Importance',
        cell: ({ row }) => getImportanceLabel(row.original.importance) || '-',
      },
      {
        accessorKey: 'progress',
        header: 'Progress',
        cell: ({ row }) => `${row.original.progress}%`,
      },
      {
        accessorKey: 'effort',
        header: 'Effort',
        cell: ({ row }) => row.original.effort ?? '-',
      },
      {
        accessorKey: 'deadline',
        header: 'Deadline',
        cell: ({ row }) =>
          row.original.deadline
            ? new Date(row.original.deadline).toLocaleDateString()
            : '-',
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const todo = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={todo.completed}
                  onCheckedChange={() => onToggleTodo(todo.id, todo.completed)}
                >
                  Completed
                </DropdownMenuCheckboxItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDeleteTodo(todo.id)}
                >
                  Delete task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [onDeleteTodo, onToggleTodo],
  );

  const table = useReactTable({
    data: todos,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

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
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
