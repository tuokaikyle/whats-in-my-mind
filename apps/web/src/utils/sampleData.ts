import { AppColors300 } from './enums';
import type { Category, Task } from './types';

function createTasks(
  input: { category: string; color: string; tasks: string[] }[],
) {
  const categories: Category[] = input.map((c, i) => ({
    id: i + 1,
    name: c.category,
    color: c.color,
  }));

  let id = 1;
  const tasks: Task[] = [];

  for (const [catIdx, cat] of input.entries()) {
    for (const text of cat.tasks) {
      const now = new Date();
      tasks.push({
        id: id++,
        text,
        categoryId: catIdx + 1,
        effort: Math.floor(Math.random() * 5) + 1,
        progress: Math.random() > 0.5 ? Math.floor(Math.random() * 101) : null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
    }
  }

  return { tasks, categories };
}

const { tasks: sampleData, categories: sampleCategories } = createTasks([
  {
    category: 'Learn',
    color: AppColors300.Indigo300,
    tasks: ['React', 'TypeScript', 'GraphQL'],
  },
  {
    category: 'Read',
    color: AppColors300.Rose300,
    tasks: ['Vanity Fair', 'Les Miserables'],
  },
  {
    category: 'Sport',
    color: AppColors300.Green300,
    tasks: ['Gym', 'Tennis', 'Swimming'],
  },
  {
    category: 'Travel',
    color: AppColors300.Orange300,
    tasks: ['Rome', 'Paris', 'New York'],
  },
  {
    category: 'Buy',
    color: AppColors300.Violet300,
    tasks: ['Milk', 'Bread', 'Ice Cream'],
  },
]);

export { sampleCategories, sampleData };
