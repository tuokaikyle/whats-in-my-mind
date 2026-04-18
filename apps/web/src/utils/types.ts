export type Task = {
  id: number;
  text: string;
  completed: boolean;
  categoryId: number | null;
  effort: number | null;
  importance: number | null;
  progress: number;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: number;
  name: string;
  color: string | null;
};

export const PRESET_COLORS = [
  '#f43f5e', // Rose
  '#f97316', // Orange
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#94a3b8', // Slate
];
