export type TodoMetadata = Record<string, unknown>;

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
