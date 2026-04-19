import { type Category, AppColors, type Task } from './types';

export const sampleCategories: Category[] = [
  { id: 1, name: 'Read', color: AppColors.Rose },
  { id: 2, name: 'Study', color: AppColors.Indigo },
  { id: 3, name: 'Sport', color: AppColors.Green },
  { id: 4, name: 'Travel', color: AppColors.Orange },
  { id: 5, name: 'Buy', color: AppColors.Violet },
  { id: 6, name: 'Project', color: AppColors.Slate },
];

const iso = (d: string) => new Date(d).toISOString();

const base = (
  id: number,
  text: string,
  categoryId: number,
  deadline: string,
): Task => ({
  id,
  text,
  categoryId,
  completed: false,
  effort: Math.round(Math.random() * 5),
  importance: Math.round(Math.random() * 5),
  progress: Math.round(Math.random() * 100) || null,
  deadline: iso(deadline),
  createdAt: iso(deadline),
  updatedAt: iso(deadline),
});

export const sampleData: Task[] = [
  base(1, 'Vanity Fair', 1, '2026-01-01'),
  base(2, 'Les Miserables', 1, '2026-01-01'),

  base(34, 'Python', 2, '2026-01-03'),
  base(35, 'Painting', 2, '2026-01-04'),
  base(36, 'Docker', 2, '2026-01-04'),

  base(22, 'Gym', 3, '2026-01-02'),
  base(23, 'Tennis', 3, '2026-01-04'),
  base(24, 'Swimming', 3, '2026-01-04'),

  base(46, 'Rome', 4, '2026-01-04'),
  base(47, 'Paris', 4, '2026-01-04'),
  base(48, 'New York', 4, '2026-01-04'),

  base(56, 'Milk', 5, '2026-01-04'),
  base(57, 'Bread', 5, '2026-01-04'),
  base(65, 'Ice Cream', 5, '2026-01-04'),
];
