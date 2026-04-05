export type BaseTask = {
  id: number;
  text: string;
}

export type Task = BaseTask & {
  completed?: boolean;
  progress?: number;
  category?: string;
  effort?: number;
  importance?: number;
  deadline?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type SimpleTask = BaseTask & {
  completed: boolean;
}

export type TableTask = Omit<BaseTask, 'updatedAt'>

export type SlideTask = BaseTask & {
  progress: number;
}