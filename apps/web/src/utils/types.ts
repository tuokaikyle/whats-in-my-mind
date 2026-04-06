export type SimpleTask = {
  id: number;
  text: string;
  completed: boolean;
}

export type Task = SimpleTask & {
  progress?: number;
  categoryId?: number | null;
  effort?: number | null;
  importance?: number | null;
  deadline?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type TableTask = SimpleTask & {
  categoryId: number | null;
  completed: boolean;
  effort: number | null;
  importance: number | null;
  progress: number;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SlideTask = SimpleTask & {
  progress: number;
}

// export type BubbleTask = SimpleTask & {
//   effort: number;
//   categoryId: number | null;
// }

// more to come...
// use zod? 

export type Category = {
  id: number;
  name: string;
  color: string;
}

export const PRESET_COLORS = [
  '#f43f5e', // Rose
  '#f97316', // Orange
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet  
  '#94a3b8', // Slate
];