export type BaseTask = {
  id: number;
  text: string;
}

export type Task = BaseTask & {
  completed?: boolean;
  progress?: number;
  categoryId?: number | null;
  effort?: number | null;
  importance?: number | null;
  deadline?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type SimpleTask = BaseTask & {
  completed: boolean;
}

export type TableTask = Omit<BaseTask, 'updatedAt'>

export type SlideTask = BaseTask & {
  progress: number;
}
