import { PRESET_COLORS, type Category, type TableTask } from "./types";

export const sampleCategories: Category[] = [
  {
    id: 1,
    name: 'Read',
    color: PRESET_COLORS[0],
  },
  {
    id: 3,
    name: 'Health',
    color: PRESET_COLORS[2],
  },
  {
    id: 5,
    name: 'Study',
    color: PRESET_COLORS[4],
  },
  {
    id: 6,
    name: 'Travel',
    color: PRESET_COLORS[5]
  }
]

export const sampleData: TableTask[] = [
  {
    id: 1,
    text: 'Vanity Fair',
    categoryId: 1,
    completed: false,
    effort: 1,
    importance: 1,
    progress: 0,
    deadline: new Date('2026-01-01').toISOString(),
    createdAt: new Date('2026-01-01').toISOString(),
    updatedAt: new Date('2026-01-01').toISOString(),
  },
  {
    id: 2,
    text: 'Gym',
    categoryId: 3,
    completed: false,
    effort: 2,
    importance: 2,
    progress: 0,
    deadline: new Date('2026-01-02').toISOString(),
    createdAt: new Date('2026-01-02').toISOString(),
    updatedAt: new Date('2026-01-02').toISOString(),
  },
  {
    id: 3,
    text: 'Tennis',
    categoryId: 3,
    completed: false,
    effort: 4,
    importance: 4,
    progress: 0,
    deadline: new Date('2026-01-04').toISOString(),
    createdAt: new Date('2026-01-04').toISOString(),
    updatedAt: new Date('2026-01-04').toISOString(),
  },
  {
    id: 4,
    text: 'Python',
    categoryId: 5,
    completed: false,
    effort: 3,
    importance: 3,
    progress: 0,
    deadline: new Date('2026-01-03').toISOString(),
    createdAt: new Date('2026-01-03').toISOString(),
    updatedAt: new Date('2026-01-03').toISOString(),
  },
  {
    id: 5,
    text: 'Painting',
    categoryId: 5,
    completed: false,
    effort: 4,
    importance: 4,
    progress: 0,
    deadline: new Date('2026-01-04').toISOString(),
    createdAt: new Date('2026-01-04').toISOString(),
    updatedAt: new Date('2026-01-04').toISOString(),
  },
  {
    id: 6,
    text: 'Rome',
    categoryId: 6,
    completed: false,
    effort: 4,
    importance: 4,
    progress: 0,
    deadline: new Date('2026-01-04').toISOString(),
    createdAt: new Date('2026-01-04').toISOString(),
    updatedAt: new Date('2026-01-04').toISOString(),
  },
  {
    id: 7,
    text: 'Paris',
    categoryId: 6,
    completed: false,
    effort: 4,
    importance: 4,
    progress: 0,
    deadline: new Date('2026-01-04').toISOString(),
    createdAt: new Date('2026-01-04').toISOString(),
    updatedAt: new Date('2026-01-04').toISOString(),
  }
]


