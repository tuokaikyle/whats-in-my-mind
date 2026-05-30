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
    headSimple?: {
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
