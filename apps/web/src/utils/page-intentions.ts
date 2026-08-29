export const pageIntentions = {
  simple: {
    title: 'Simple',
    description: 'A clean, draggable checklist for quick capture and reordering.',
  },
  progress: {
    title: 'Progress',
    description: 'Track effort and completion with progress bars.',
  },
  bubble: {
    title: 'Bubble',
    description: 'See your tasks as a bubble chart by category and effort.',
  },
  treemap: {
    title: 'Tree Map',
    description: 'Explore tasks organized by category in a space-filling layout.',
  },
  ring: {
    title: 'Ring',
    description: 'Active tasks as a ring; arc length is effort, fill is progress.',
  },
  kpigauge: {
    title: 'KPI Gauge',
    description: 'Pin up to three tasks as concentric gauge rings for a focused snapshot.',
  },
  readiness: {
    title: 'Readiness',
    description: 'Gauge how ready each task is to start; locks to ready once work begins.',
  },
} as const;

export type PageIntentionKey = keyof typeof pageIntentions;
