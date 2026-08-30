import { EFFORT_RANGE, highChartColors } from './enums';
import type { Category, Task } from './types';

const sampleCategories: Category[] = [
  { id: 1, name: 'Learn', color: highChartColors.Indigo },
  { id: 2, name: 'Read', color: highChartColors.SteelBlue },
  { id: 3, name: 'Sport', color: highChartColors.Green },
  { id: 4, name: 'Travel', color: highChartColors.Pink },
  { id: 5, name: 'Buy', color: highChartColors.Blue },
];

type SampleTaskSeed = {
  id: number;
  text: string;
  categoryId: number;
  createdDaysAgo: number;
};

type SampleTaskState = 'completed' | 'in-progress' | 'unstarted';

function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInteger(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffled<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInteger(0, index);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(12, 0, 0, 0);
  return date.toISOString();
}

const sampleTaskSeeds: SampleTaskSeed[] = [
  // Learn
  { id: 1, text: 'React', categoryId: 1, createdDaysAgo: 14 },
  { id: 2, text: 'TypeScript', categoryId: 1, createdDaysAgo: 13 },
  { id: 3, text: 'GraphQL', categoryId: 1, createdDaysAgo: 12 },

  // Read
  { id: 4, text: 'Vanity Fair', categoryId: 2, createdDaysAgo: 11 },
  { id: 5, text: 'Les Miserables', categoryId: 2, createdDaysAgo: 10 },

  // Sport
  { id: 6, text: 'Gym', categoryId: 3, createdDaysAgo: 9 },
  { id: 7, text: 'Tennis', categoryId: 3, createdDaysAgo: 8 },
  { id: 8, text: 'Swimming', categoryId: 3, createdDaysAgo: 7 },

  // Travel
  { id: 9, text: 'Rome', categoryId: 4, createdDaysAgo: 6 },
  { id: 10, text: 'Paris', categoryId: 4, createdDaysAgo: 5 },
  { id: 11, text: 'New York', categoryId: 4, createdDaysAgo: 4 },

  // Buy
  { id: 12, text: 'Milk', categoryId: 5, createdDaysAgo: 3 },
  { id: 13, text: 'Bread', categoryId: 5, createdDaysAgo: 2 },
  { id: 14, text: 'Ice Cream', categoryId: 5, createdDaysAgo: 1 },
];

const inProgressIds = new Set(
  sampleCategories.map((category) => randomItem(sampleTaskSeeds.filter((seed) => seed.categoryId === category.id)).id),
);
const completedIds = new Set(
  shuffled(sampleTaskSeeds.filter((seed) => !inProgressIds.has(seed.id)))
    .slice(0, 3)
    .map((seed) => seed.id),
);

const sampleData: Task[] = sampleTaskSeeds.map((seed) => {
  const state: SampleTaskState = inProgressIds.has(seed.id)
    ? 'in-progress'
    : completedIds.has(seed.id)
      ? 'completed'
      : 'unstarted';
  const effort =
    state === 'in-progress' ? randomItem(EFFORT_RANGE.filter((value) => value > 1)) : randomItem(EFFORT_RANGE);
  const progress = state === 'completed' ? effort : state === 'in-progress' ? randomInteger(1, effort - 1) : 0;
  const readiness = state === 'unstarted' ? randomInteger(0, 3) : null;
  const createdAt = daysAgo(seed.createdDaysAgo);
  const completedAt = state === 'completed' ? daysAgo(randomInteger(0, seed.createdDaysAgo)) : null;

  return {
    id: seed.id,
    text: seed.text,
    categoryId: seed.categoryId,
    effort,
    progress,
    metadata: readiness != null ? { readiness } : null,
    createdAt,
    updatedAt: completedAt ?? createdAt,
    completedAt,
  };
});

export { sampleCategories, sampleData };
