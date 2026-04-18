import { type Category, PRESET_COLORS, type Task } from './types';

export const sampleCategories: Category[] = [
  { id: 1, name: 'Read', color: PRESET_COLORS[0] },
  { id: 3, name: 'Health', color: PRESET_COLORS[2] },
  { id: 5, name: 'Study', color: PRESET_COLORS[4] },
  { id: 6, name: 'Travel', color: PRESET_COLORS[5] },
];

const iso = (d: string) => new Date(d).toISOString();

const base = (
  id: number,
  text: string,
  categoryId: number,
  importance: number,
  effort: number,
  deadline: string,
): Task => ({
  id,
  text,
  categoryId,
  completed: false,
  effort,
  importance,
  progress: 0,
  deadline: iso(deadline),
  createdAt: iso(deadline),
  updatedAt: iso(deadline),
});

export const sampleData: Task[] = [
  base(1, 'Vanity Fair', 1, 2, 3, '2026-01-01'),
  base(8, 'Les Miserables', 1, 3, 3, '2026-01-01'),
  base(2, 'Gym', 3, 2, 2, '2026-01-02'),
  base(3, 'Tennis', 3, 4, 4, '2026-01-04'),
  base(4, 'Python', 5, 3, 3, '2026-01-03'),
  base(5, 'Painting', 5, 4, 4, '2026-01-04'),
  base(6, 'Rome', 6, 4, 4, '2026-01-04'),
  base(7, 'Paris', 6, 5, 4, '2026-01-04'),
];
