export type TodoMetadata = {
  voronoi?: {
    rectangular?: {
      x: number;
      y: number;
    };
    headSide?: {
      x: number;
      y: number;
    };
    brain?: {
      x: number;
      y: number;
    };
    shirt?: {
      x: number;
      y: number;
    };
  };
  [key: string]: unknown;
};

export type Task = {
  id: number;
  text: string;
  completed: boolean;
  categoryId: number | null;
  effort: number | null;
  importance: number | null;
  progress: number | null;
  deadline: string | null;
  metadata?: TodoMetadata | null;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: number;
  name: string;
  color: string | null;
};

export enum AppColors {
  Rose = '#f43f5e',
  Orange = '#f97316',
  Green = '#22c55e',
  Blue = '#3b82f6',
  Indigo = '#6366f1',
  Violet = '#8b5cf6',
  Slate = '#94a3b8',
}
