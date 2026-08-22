import { CheckCircle2, Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { DeleteTodoDialog } from '@/components/delete-todo-dialog';
import { ManageCategory } from '@/components/manage-category';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EFFORT_RANGE, PROGRESS_RANGE } from '@/utils/enums';
import type { Task } from '@/utils/types';

interface EditTodoFormProps {
  todo: Task;
  categories: { id: number; name: string; color: string | null }[];
  onUpdate: (data: { text?: string; categoryId?: number | null; effort?: number; progress?: number }) => void;
  onDelete: () => void;
  onClose: () => void;
  isUpdating?: boolean;
}

export function EditTodoForm({ todo, categories, onUpdate, onDelete, onClose, isUpdating = false }: EditTodoFormProps) {
  const effort = todo.effort ?? 1;
  const [editName, setEditName] = useState(todo.text);
  const [editCategoryId, setEditCategoryId] = useState(todo.categoryId?.toString() ?? 'none');
  const [editEffort, setEditEffort] = useState(effort.toString());
  const [editProgress, setEditProgress] = useState((todo.progress ?? 0).toString());
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const progressOptions = PROGRESS_RANGE.filter((n) => n <= Number.parseInt(editEffort, 10));

  const handleEffortChange = (value: string) => {
    setEditEffort(value);
    setEditProgress((current) => Math.min(Number.parseInt(current, 10), Number.parseInt(value, 10)).toString());
  };

  const handleSave = () => {
    const text = editName.trim();
    if (!text) return;

    onUpdate({
      text,
      categoryId: editCategoryId === 'none' ? null : Number.parseInt(editCategoryId, 10),
      effort: Number.parseInt(editEffort, 10),
      progress: Math.min(Number.parseInt(editProgress, 10), Number.parseInt(editEffort, 10)),
    });
    onClose();
  };

  const handleMarkAsDone = () => {
    const effortValue = Number.parseInt(editEffort, 10);
    setEditProgress(effortValue.toString());
    onUpdate({
      text: editName.trim() || todo.text,
      categoryId: editCategoryId === 'none' ? null : Number.parseInt(editCategoryId, 10),
      effort: effortValue,
      progress: effortValue,
    });
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    setDeleteOpen(false);
  };

  return (
    <>
      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor={`todo-name-${todo.id}`}>Name</Label>
          <Input id={`todo-name-${todo.id}`} value={editName} onChange={(event) => setEditName(event.target.value)} />
        </div>

        <div className='space-y-2'>
          <Label>Category</Label>
          <Select value={editCategoryId} onValueChange={setEditCategoryId}>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select category' />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  <span
                    className='h-3 w-3 shrink-0 rounded-full border'
                    style={{ backgroundColor: cat.color ?? '#6366f1' }}
                  />
                  {cat.name}
                </SelectItem>
              ))}
              <SelectItem value='none'>
                <span className='h-3 w-3 shrink-0 rounded-full' style={{ backgroundColor: '#6b8abc' }} />
                No category
              </SelectItem>
              <SelectSeparator />
              <SelectItem
                value='__add_new__'
                onPointerUp={(e) => {
                  e.preventDefault();
                  setCategoryOpen(true);
                }}
                onSelect={(e) => {
                  e.preventDefault();
                }}
              >
                <Plus className='mr-2 h-4 w-4' />
                Add new
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='grid grid-cols-2 gap-3'>
          <div className='space-y-2'>
            <Label>Effort</Label>
            <Select value={editEffort} onValueChange={handleEffortChange}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Effort' />
              </SelectTrigger>
              <SelectContent>
                {EFFORT_RANGE.map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor={`todo-progress-${todo.id}`}>Progress</Label>
            <Select value={editProgress} onValueChange={setEditProgress}>
              <SelectTrigger id={`todo-progress-${todo.id}`} className='w-full'>
                <SelectValue placeholder='Progress' />
              </SelectTrigger>
              <SelectContent>
                {progressOptions.map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className='mt-6 grid grid-cols-2 gap-2 border-t pt-4'>
        <Button variant='outline' onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!editName.trim() || isUpdating}>
          {isUpdating && <Loader2 className='mr-1 h-3.5 w-3.5 animate-spin' />}
          Save
        </Button>
      </div>

      {Number.parseInt(editEffort, 10) !== Number.parseInt(editProgress, 10) && (
        <Button
          variant='outline'
          className='mt-2 w-full border-green-500/30 text-green-600 hover:bg-green-500/10 hover:text-green-600'
          onClick={handleMarkAsDone}
          disabled={isUpdating}
        >
          {isUpdating ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <CheckCircle2 className='mr-2 h-4 w-4' />}
          Mark as Done
        </Button>
      )}

      <Button
        variant='outline'
        className='mt-4 w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive'
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 className='mr-2 h-4 w-4' />
        Delete
      </Button>

      <DeleteTodoDialog open={deleteOpen} onOpenChange={setDeleteOpen} todoText={todo.text} onDelete={handleDelete} />

      <ManageCategory open={categoryOpen} onOpenChange={setCategoryOpen} categories={categories} />
    </>
  );
}
