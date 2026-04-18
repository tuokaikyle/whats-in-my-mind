import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { AddCategory } from '@/components/add-category';
import { AddTaskDrawer } from '@/components/add-task-drawer';
import { GuestBanner } from '@/components/guest-banner';
import { PageLoader } from '@/components/page-loader';
import { Slider } from '@/components/ui/slider';
import { useCategories, useTodos } from '@/hooks/use-todos';

export const Route = createFileRoute('/slide')({
  component: SlidePage,
});

function SlidePage() {
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [draftProgress, setDraftProgress] = useState<Record<number, number>>(
    {},
  );
  const { todos, todosLoading, createMutation, updateMutation, isGuest } =
    useTodos();
  const { categories } = useCategories();

  return (
    <>
      <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-10">
        {isGuest && <GuestBanner />}

        {todosLoading ? (
          <PageLoader />
        ) : todos.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground text-sm">
            No tasks yet. Use the + button to add one!
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {todos.map((task) => {
              const current = draftProgress[task.id] ?? task.progress ?? 0;
              return (
                <div key={task.id} className="flex items-center gap-3 text-sm">
                  <span className="w-32 shrink-0 justify-self-end truncate">
                    {task.text}
                  </span>
                  <Slider
                    value={[current]}
                    onValueChange={([v]) =>
                      setDraftProgress((prev) => ({ ...prev, [task.id]: v }))
                    }
                    onValueCommit={([v]) => {
                      setDraftProgress((prev) => ({ ...prev, [task.id]: v }));
                      updateMutation.mutate({ id: task.id, progress: v });
                    }}
                    max={100}
                    step={1}
                  />
                  <span className="w-8 shrink-0 text-right text-gray-500">
                    {current}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
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
