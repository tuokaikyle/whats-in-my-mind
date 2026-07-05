export type TodoMetadata = Record<string, unknown>;

export type Task = {
  id: number;
  text: string;
  categoryId: number | null;
  effort: number | null;
  progress: number | null;
  metadata?: TodoMetadata | null;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: number;
  name: string;
  color: string | null;
};
