import { useMutation, useQuery } from '@tanstack/react-query';
import type { inferRouterInputs } from '@trpc/server';
import type { AppRouter } from '@whats-in-my-mind/api/routers/index';
import { useMemo } from 'react';
import { authClient } from '@/lib/auth-client';
import { EFFORT_RANGE, MAX_EFFORT } from '@/utils/enums';
import { sampleCategories, sampleData } from '@/utils/sampleData';
import { queryClient, trpc, trpcClient } from '@/utils/trpc';
import type { Category, Task } from '@/utils/types';

type RouterInputs = inferRouterInputs<AppRouter>;
type CreateInput = RouterInputs['todo']['create'];
type UpdateInput = RouterInputs['todo']['update'];
type DeleteInput = RouterInputs['todo']['delete'];
type ReorderSimpleInput = RouterInputs['todo']['reorderSimple'];
type CreateCategoryInput = RouterInputs['category']['create'];
type DeleteCategoryInput = RouterInputs['category']['delete'];
type UpdateCategoryInput = RouterInputs['category']['update'];

const GUEST_TODOS_KEY = ['guest', 'todos'] as const;
const GUEST_CATEGORIES_KEY = ['guest', 'categories'] as const;

function useAuthState() {
  const { data: session, isPending } = authClient.useSession();
  const sessionLoading = isPending;
  const isGuest = !sessionLoading && !session;
  return { isGuest, sessionLoading };
}

function normalizeTodo(todo: Task): Task {
  const effort =
    todo.effort == null || todo.effort < EFFORT_RANGE[0] ? EFFORT_RANGE[0] : Math.min(todo.effort, MAX_EFFORT);

  if (todo.progress == null) return { ...todo, effort };

  const rawProgress = todo.progress > MAX_EFFORT ? Math.round((todo.progress / 100) * effort) : todo.progress;

  return {
    ...todo,
    effort,
    progress: Math.max(0, Math.min(effort, rawProgress)),
  };
}

function computeCompletedAt(todo: Task, patch: Partial<Pick<Task, 'effort' | 'progress'>>): string | null {
  const effort = patch.effort ?? todo.effort;
  const progress = patch.progress ?? todo.progress;
  if (effort != null && effort > 0 && progress != null && progress >= effort) {
    return todo.completedAt ?? new Date().toISOString();
  }
  return null;
}

export function useTodos() {
  const { isGuest, sessionLoading } = useAuthState();

  const authQueryOptions = trpc.todo.getAll.queryOptions();
  const queryKey: readonly unknown[] = isGuest ? GUEST_TODOS_KEY : authQueryOptions.queryKey;

  const authQuery = useQuery({
    ...authQueryOptions,
    staleTime: 5 * 60 * 1000,
    enabled: !sessionLoading && !isGuest,
  });

  const guestQuery = useQuery<Task[]>({
    queryKey: GUEST_TODOS_KEY,
    queryFn: () => queryClient.getQueryData<Task[]>(GUEST_TODOS_KEY) ?? sampleData,
    staleTime: Number.POSITIVE_INFINITY,
    initialData: sampleData,
    enabled: !sessionLoading && isGuest,
  });

  const todosQuery = sessionLoading ? authQuery : isGuest ? guestQuery : authQuery;

  const setCache = (updater: (prev: Task[]) => Task[]) =>
    queryClient.setQueryData<Task[]>(queryKey, (prev) => updater(prev ?? []));

  const snapshot = () => queryClient.getQueryData<Task[]>(queryKey);
  const restore = (prev: Task[] | undefined) => {
    if (prev) queryClient.setQueryData(queryKey, prev);
  };
  const invalidate = () => (isGuest ? undefined : queryClient.invalidateQueries({ queryKey }));

  const createMutation = useMutation<Task | unknown, Error, CreateInput>({
    mutationFn: isGuest
      ? async (input) => {
          const now = new Date().toISOString();
          const effort = input.effort ?? null;
          const progress = input.progress ?? 0;
          return {
            id: Date.now(),
            text: input.text,
            categoryId: input.categoryId ?? null,
            effort,
            progress,
            metadata: input.metadata ?? null,
            createdAt: now,
            updatedAt: now,
            completedAt: effort != null && effort > 0 && progress >= effort ? now : null,
          } satisfies Task;
        }
      : (input) => trpcClient.todo.create.mutate(input),
    onSuccess: (result) => {
      if (isGuest) setCache((prev) => [...prev, result as Task]);
      else invalidate();
    },
  });

  const updateMutation = useMutation<unknown, Error, UpdateInput, { prev: Task[] | undefined }>({
    mutationFn: isGuest ? async (v) => v : (v) => trpcClient.todo.update.mutate(v),
    onMutate: async (v) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = snapshot();
      setCache((list) =>
        list.map((t) =>
          t.id === v.id ? { ...t, ...(v as Partial<Task>), completedAt: computeCompletedAt(t, v as Partial<Task>) } : t,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => restore(ctx?.prev),
    onSettled: () => invalidate(),
  });

  const deleteMutation = useMutation<unknown, Error, DeleteInput, { prev: Task[] | undefined }>({
    mutationFn: isGuest ? async (v) => v : (v) => trpcClient.todo.delete.mutate(v),
    onMutate: async (v) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = snapshot();
      setCache((list) => list.filter((t) => t.id !== v.id));
      return { prev };
    },
    onError: (_e, _v, ctx) => restore(ctx?.prev),
    onSettled: () => invalidate(),
  });

  const reorderSimpleMutation = useMutation<unknown, Error, ReorderSimpleInput, { prev: Task[] | undefined }>({
    mutationFn: isGuest ? async (v) => v : (v) => trpcClient.todo.reorderSimple.mutate(v),
    onMutate: async (v) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = snapshot();
      setCache((list) =>
        list.map((t) =>
          t.id === v.id
            ? {
                ...t,
                metadata: {
                  ...(t.metadata ?? {}),
                  simpleOrder: v.simpleOrder,
                },
              }
            : t,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => restore(ctx?.prev),
    onSettled: () => invalidate(),
  });

  const todos = useMemo(() => ((todosQuery.data ?? []) as Task[]).map(normalizeTodo), [todosQuery.data]);
  const todosLoading = sessionLoading || todosQuery.isLoading;

  return {
    todos,
    todosLoading,
    createMutation,
    updateMutation,
    deleteMutation,
    reorderSimpleMutation,
    isGuest,
  };
}

export function useCategories() {
  const { isGuest, sessionLoading } = useAuthState();
  const authQueryOptions = trpc.category.getAll.queryOptions();
  const todoQueryOptions = trpc.todo.getAll.queryOptions();
  const categoryQueryKey: readonly unknown[] = isGuest ? GUEST_CATEGORIES_KEY : authQueryOptions.queryKey;
  const todoQueryKey: readonly unknown[] = isGuest ? GUEST_TODOS_KEY : todoQueryOptions.queryKey;

  const authQuery = useQuery({
    ...authQueryOptions,
    staleTime: 5 * 60 * 1000,
    enabled: !sessionLoading && !isGuest,
  });
  const guestQuery = useQuery<Category[]>({
    queryKey: GUEST_CATEGORIES_KEY,
    queryFn: () => queryClient.getQueryData<Category[]>(GUEST_CATEGORIES_KEY) ?? sampleCategories,
    staleTime: Number.POSITIVE_INFINITY,
    initialData: sampleCategories,
    enabled: !sessionLoading && isGuest,
  });
  const query = sessionLoading ? authQuery : isGuest ? guestQuery : authQuery;

  const createMutation = useMutation<Category | unknown, Error, CreateCategoryInput>({
    mutationFn: isGuest
      ? async (input) => ({
          id: Date.now(),
          name: input.name,
          color: input.color ?? null,
        })
      : (input) => trpcClient.category.create.mutate(input),
    onSuccess: (result) => {
      if (isGuest) {
        queryClient.setQueryData<Category[]>(categoryQueryKey, (prev) => [...(prev ?? []), result as Category]);
      } else {
        queryClient.invalidateQueries({ queryKey: categoryQueryKey });
      }
    },
  });

  const deleteMutation = useMutation<unknown, Error, DeleteCategoryInput>({
    mutationFn: isGuest
      ? async (input) => {
          queryClient.setQueryData<Category[]>(categoryQueryKey, (prev) =>
            (prev ?? []).filter((c) => c.id !== input.id),
          );
          queryClient.setQueryData<Task[]>(todoQueryKey, (prev) =>
            (prev ?? []).map((todo) => (todo.categoryId === input.id ? { ...todo, categoryId: null } : todo)),
          );
        }
      : (input) => trpcClient.category.delete.mutate(input),
    onSuccess: () => {
      if (!isGuest) {
        queryClient.invalidateQueries({ queryKey: categoryQueryKey });
        queryClient.invalidateQueries({ queryKey: todoQueryKey });
      }
    },
  });

  const updateMutation = useMutation<unknown, Error, UpdateCategoryInput>({
    mutationFn: isGuest
      ? async (input) => {
          queryClient.setQueryData<Category[]>(categoryQueryKey, (prev) =>
            (prev ?? []).map((c) => (c.id === input.id ? { ...c, ...input } : c)),
          );
        }
      : (input) => trpcClient.category.update.mutate(input),
    onSuccess: () => {
      if (!isGuest) {
        queryClient.invalidateQueries({ queryKey: categoryQueryKey });
      }
    },
  });

  const categories = (query.data ?? []) as Category[];

  return {
    categories,
    isLoading: query.isLoading,
    createMutation,
    deleteMutation,
    updateMutation,
    isGuest,
  };
}
