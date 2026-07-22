import {
  EFFORT_RANGE,
  highChartColors,
  MAX_EFFORT,
  PROGRESS_RANGE,
} from './enums';
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
      const effort = Math.floor(Math.random() * MAX_EFFORT) + EFFORT_RANGE[0];

      tasks.push({
        id: id++,
        text,
        categoryId: catIdx + 1,
        effort,
        progress:
          Math.random() > 0.5
            ? PROGRESS_RANGE[Math.floor(Math.random() * (effort + 1))]
            : null,
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
    color: highChartColors.Indigo,
    tasks: ['React', 'TypeScript', 'GraphQL'],
  },
  {
    category: 'Read',
    color: highChartColors.SteelBlue,
    tasks: ['Vanity Fair', 'Les Miserables'],
  },
  {
    category: 'Sport',
    color: highChartColors.Green,
    tasks: ['Gym', 'Tennis', 'Swimming'],
  },
  {
    category: 'Travel',
    color: highChartColors.Pink,
    tasks: ['Rome', 'Paris', 'New York'],
  },
  {
    category: 'Buy',
    color: highChartColors.Blue,
    tasks: ['Milk', 'Bread', 'Ice Cream'],
  },
]);

export { sampleCategories, sampleData };
