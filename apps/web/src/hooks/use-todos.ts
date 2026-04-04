import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient, trpc } from '@/utils/trpc';

export function useTodos() {
  const todosQueryOptions = trpc.todo.getAll.queryOptions();
  const todosQuery = useQuery({
    ...todosQueryOptions,
    staleTime: 5 * 60 * 1000,
  });
  type TodosData = NonNullable<typeof todosQuery.data>;

  const invalidateTodos = () => {
    queryClient.invalidateQueries({
      queryKey: todosQueryOptions.queryKey,
    });
  };

  const createMutation = useMutation(
    trpc.todo.create.mutationOptions({
      onSuccess: invalidateTodos,
    }),
  );

  const updateMutation = useMutation(
    trpc.todo.update.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey: todosQueryOptions.queryKey });
        const previousTodos = queryClient.getQueryData<TodosData>(
          todosQueryOptions.queryKey,
        );

        queryClient.setQueryData<TodosData>(
          todosQueryOptions.queryKey,
          (oldTodos) =>
            oldTodos?.map((todo) =>
              todo.id === variables.id ? { ...todo, ...variables } : todo,
            ),
        );

        return { previousTodos };
      },
      onError: (_error, _variables, context) => {
        if (context?.previousTodos) {
          queryClient.setQueryData(todosQueryOptions.queryKey, context.previousTodos);
        }
      },
      onSettled: invalidateTodos,
    }),
  );

  const deleteMutation = useMutation(
    trpc.todo.delete.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey: todosQueryOptions.queryKey });
        const previousTodos = queryClient.getQueryData<TodosData>(
          todosQueryOptions.queryKey,
        );

        queryClient.setQueryData<TodosData>(
          todosQueryOptions.queryKey,
          (oldTodos) =>
            oldTodos?.filter((todo) => todo.id !== variables.id),
        );

        return { previousTodos };
      },
      onError: (_error, _variables, context) => {
        if (context?.previousTodos) {
          queryClient.setQueryData(todosQueryOptions.queryKey, context.previousTodos);
        }
      },
      onSettled: invalidateTodos,
    }),
  );

  return {
    todos: todosQuery,
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
