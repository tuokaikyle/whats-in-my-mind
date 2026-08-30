export enum TrackedField {
  Progress = 'progress',
  Effort = 'effort',
  Category = 'category',
  Readiness = 'readiness',
  CreatedTime = 'created time',
}

export enum ViewFeature {
  Draggable = 'draggable',
  Clickable = 'clickable',
  Sort = 'sort',
  IconToEdit = 'icon-to-edit',
  PanelToEdit = 'panel-to-edit',
  Animation = 'animation',
  Drilldown = 'drilldown',
  Picker = 'picker',
}

type About = {
  details: string;
  keepsTrackOf: readonly TrackedField[];
  features: readonly ViewFeature[];
};

export const pageMetadata = {
  simple: {
    title: 'Simple',
    description: 'Draggable items with clickable dots',
    about: {
      details: 'A clean, draggable checklist for quick capture and reordering.',
      keepsTrackOf: [TrackedField.Progress, TrackedField.Effort],
      features: [ViewFeature.Draggable, ViewFeature.Clickable, ViewFeature.IconToEdit],
    },
  },
  progress: {
    title: 'Progress',
    description: 'Clickable progress bar and animated gauge',
    about: {
      details: 'Track task progress and effort with progress bars.',
      keepsTrackOf: [TrackedField.Progress, TrackedField.Effort, TrackedField.CreatedTime],
      features: [ViewFeature.Clickable, ViewFeature.Sort, ViewFeature.IconToEdit, ViewFeature.Animation],
    },
  },
  bubble: {
    title: 'Bubble',
    description: 'Packed bubbles representing tasks',
    about: {
      details: 'Tasks as a bubble chart by category and effort.',
      keepsTrackOf: [TrackedField.Effort, TrackedField.Category],
      features: [ViewFeature.Clickable, ViewFeature.Draggable, ViewFeature.PanelToEdit],
    },
  },
  treemap: {
    title: 'Tree Map',
    description: 'Bigger grids representing bigger tasks',
    about: {
      details: 'Tasks by category in a space-filling layout.',
      keepsTrackOf: [TrackedField.Effort, TrackedField.Category],
      features: [ViewFeature.PanelToEdit, ViewFeature.Drilldown],
    },
  },
  ring: {
    title: 'Ring',
    description: 'Measuring task completeness',
    about: {
      details: 'Each arc is a task; length is effort, fill is progress.',
      keepsTrackOf: [TrackedField.Progress, TrackedField.Effort, TrackedField.Category],
      features: [ViewFeature.Clickable, ViewFeature.PanelToEdit, ViewFeature.Animation],
    },
  },
  kpigauge: {
    title: 'KPI Gauge',
    description: 'Comparing task completeness.',
    about: {
      details: 'Compare the progress of up to three selected tasks as concentric gauge rings.',
      keepsTrackOf: [TrackedField.Progress, TrackedField.Effort, TrackedField.Category],
      features: [ViewFeature.Clickable, ViewFeature.PanelToEdit, ViewFeature.Picker],
    },
  },
  readiness: {
    title: 'Readiness',
    description: 'Be ready to start',
    about: {
      details: 'Assess how ready unstarted tasks are to begin. Tasks with progress are hidden.',
      keepsTrackOf: [TrackedField.Readiness],
      features: [ViewFeature.Clickable, ViewFeature.Sort],
    },
  },
  completed: {
    title: 'Completed',
    description: 'The list of the completed tasks.',
    about: {
      details: 'Browse completed tasks, ordered from most recently completed to oldest.',
      keepsTrackOf: [TrackedField.Progress, TrackedField.Category],
      features: [ViewFeature.IconToEdit],
    },
  },
} as const satisfies Record<string, { title: string; description: string; about: About }>;

export type PageMetadataKey = keyof typeof pageMetadata;
