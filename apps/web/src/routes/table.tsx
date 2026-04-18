import { createFileRoute } from '@tanstack/react-router';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  CheckCircle2,
  MoreHorizontal,
  SquareCheckBig,
  SquareDashed,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
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
import {
  DropdownMenu,
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
import { useCategories, useTodos } from '@/hooks/use-todos';
import type { Task } from '@/utils/types';

export const Route = createFileRoute('/table')({
  component: TablePage,
});

function TablePage() {
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
  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );
  const columns = useMemo<ColumnDef<Task>[]>(
    () => [
      {
        accessorKey: 'text',
        header: 'Task',
        cell: ({ row }) => (
          <span
            className={
              row.original.completed
                ? 'text-muted-foreground line-through'
                : 'font-medium'
            }
          >
            {row.original.text}
          </span>
        ),
      },
      {
        accessorKey: 'completed',
        header: 'Status',
        cell: ({ row }) =>
          row.original.completed ? (
            <span className="font-medium text-emerald-600 text-xs">
              Completed
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">Active</span>
          ),
      },
      {
        accessorKey: 'categoryId',
        header: 'Category',
        cell: ({ row }) => {
          const categoryId = row.original.categoryId;
          if (categoryId === null) return '-';
          const category = categoryById.get(categoryId);
          if (!category) return '-';
          return (
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: `${category.color ?? '#9ca3af'}22`,
                color: category.color ?? '#64748b',
              }}
            >
              {category.name}
            </span>
          );
        },
      },
      {
        accessorKey: 'importance',
        header: 'Importance',
        cell: ({ row }) => {
          const importance = row.original.importance;
          if (!importance) return '-';
          return <span className="text-sm">{importance}</span>;
        },
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
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleDateString(),
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
              <DropdownMenuContent align="start" side="right">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    updateMutation.mutate({
                      id: todo.id,
                      completed: !todo.completed,
                    })
                  }
                >
                  {todo.completed ? (
                    <SquareDashed className="mr-2 h-4 w-4" />
                  ) : (
                    <SquareCheckBig className="mr-2 h-4 w-4" />
                  )}
                  {todo.completed
                    ? 'Mark as not Completed'
                    : 'Mark as Completed'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => deleteMutation.mutate({ id: todo.id })}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [updateMutation, deleteMutation, categoryById],
  );

  const table = useReactTable({
    data: todos,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="mx-auto w-full max-w-7xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Rich Todo List</CardTitle>
            <CardDescription>
              Manage your tasks with importance and progress tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isGuest && <GuestBanner className="mb-4" />}

            {todosLoading ? (
              <PageLoader size="lg" />
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
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
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

      <AddTaskDrawer
        categories={categories}
        onSubmit={(input) => createMutation.mutate(input)}
        isPending={createMutation.isPending}
        onAddCategory={() => setAddCategoryOpen(true)}
      />
      <AddCategory open={addCategoryOpen} onOpenChange={setAddCategoryOpen} />
    </>
  );
}
