import { Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { Category } from '@/utils/types';

export type AddTaskData = {
  text: string;
  categoryId?: number | null;
  importance?: number;
  effort?: number;
  progress?: number;
  deadline?: string | null;
};

const RATING_OPTIONS = ['1', '2', '3', '4', '5'] as const;

interface AddTaskDrawerProps {
  categories: Category[];
  onSubmit: (data: AddTaskData) => void;
  isPending?: boolean;
  onAddCategory?: () => void;
}

export function AddTaskDrawer({
  categories,
  onSubmit,
  isPending = false,
  onAddCategory,
}: AddTaskDrawerProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [importance, setImportance] = useState('3');
  const [effort, setEffort] = useState('3');
  const [progress, setProgress] = useState('0');
  const [deadline, setDeadline] = useState('');

  const reset = () => {
    setText('');
    setCategoryId(undefined);
    setImportance('3');
    setEffort('3');
    setProgress('0');
    setDeadline('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    onSubmit({
      text: text.trim(),
      categoryId: categoryId ?? null,
      importance: Number.parseInt(importance, 10),
      effort: Number.parseInt(effort, 10),
      progress: Number.parseInt(progress, 10),
      deadline: deadline ? new Date(deadline).toISOString() : null,
    });

    reset();
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed top-8 right-8 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Add task"
      >
        <Plus className="h-6 w-6" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add Task</SheetTitle>
            <SheetDescription>
              Fill in the details for your new task.
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={handleSubmit}
            className="flex flex-1 flex-col overflow-y-auto"
          >
            <div className="flex flex-1 flex-col gap-5 px-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="drawer-text">Task *</Label>
                <Input
                  id="drawer-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter task description..."
                  disabled={isPending}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="drawer-importance">Importance</Label>
                  <Select
                    value={importance}
                    onValueChange={setImportance}
                    disabled={isPending}
                  >
                    <SelectTrigger id="drawer-importance" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RATING_OPTIONS.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="drawer-effort">Effort</Label>
                  <Select
                    value={effort}
                    onValueChange={setEffort}
                    disabled={isPending}
                  >
                    <SelectTrigger id="drawer-effort" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RATING_OPTIONS.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="drawer-progress">Progress (%)</Label>
                  <Input
                    id="drawer-progress"
                    type="number"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => setProgress(e.target.value)}
                    disabled={isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="drawer-deadline">Deadline</Label>
                  <Input
                    id="drawer-deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={categoryId?.toString() ?? 'none'}
                  onValueChange={(v) =>
                    setCategoryId(
                      v === 'none' ? undefined : Number.parseInt(v, 10),
                    )
                  }
                  disabled={isPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom" sideOffset={2}>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor: cat.color ?? '#9ca3af',
                            }}
                            aria-hidden="true"
                          />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                    {onAddCategory && (
                      <div className="mt-1 border-t pt-1">
                        <button
                          type="button"
                          className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            onAddCategory();
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add new category
                        </button>
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <SheetFooter className="px-4 pb-4">
              <Button
                type="submit"
                disabled={isPending || !text.trim()}
                className="w-full"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Add Task
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
