import { createFileRoute, Link } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowBigRight,
  Bubbles,
  ChevronRight,
  CircleDashed,
  ExternalLink,
  FileCheck,
  Gauge,
  LayoutGrid,
  Settings2,
  SquareCheck,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { pageMetadata, TrackedField, ViewFeature } from '@/utils/page-metadata';

export const Route = createFileRoute('/about')({
  component: RouteComponent,
});

const REPO_URL = 'https://github.com/tuokaikyle/whats-in-my-mind';

const cardClassName = 'max-sm:rounded-none max-sm:border-0 max-sm:shadow-none';

const trackedFieldLabels: Record<TrackedField, string> = {
  [TrackedField.Progress]: 'Progress',
  [TrackedField.Effort]: 'Effort',
  [TrackedField.Category]: 'Category',
  [TrackedField.Readiness]: 'Readiness',
  [TrackedField.CreatedTime]: 'Created time',
};

const viewFeatureLabels: Record<ViewFeature, string> = {
  [ViewFeature.Draggable]: 'Draggable',
  [ViewFeature.Clickable]: 'Clickable',
  [ViewFeature.Sort]: 'Sortable',
  [ViewFeature.IconToEdit]: 'Quick edit',
  [ViewFeature.PanelToEdit]: 'Panel editor',
  [ViewFeature.Animation]: 'Animation',
  [ViewFeature.Drilldown]: 'Drill-down',
  [ViewFeature.Picker]: 'Task picker',
};

type ViewEntry = {
  path: string;
  icon: LucideIcon;
  title: string;
  description: string;
  keepsTrackOf: readonly TrackedField[];
  features: readonly ViewFeature[];
};

const viewGroups = [
  {
    label: 'Views',
    description: 'Visual perspectives on your tasks.',
    items: [
      {
        path: '/simple',
        icon: FileCheck,
        title: pageMetadata.simple.title,
        description: pageMetadata.simple.about.details,
        keepsTrackOf: pageMetadata.simple.about.keepsTrackOf,
        features: pageMetadata.simple.about.features,
      },
      {
        path: '/progress',
        icon: TrendingUp,
        title: pageMetadata.progress.title,
        description: pageMetadata.progress.about.details,
        keepsTrackOf: pageMetadata.progress.about.keepsTrackOf,
        features: pageMetadata.progress.about.features,
      },
      {
        path: '/bubble',
        icon: Bubbles,
        title: pageMetadata.bubble.title,
        description: pageMetadata.bubble.about.details,
        keepsTrackOf: pageMetadata.bubble.about.keepsTrackOf,
        features: pageMetadata.bubble.about.features,
      },
      {
        path: '/treemap',
        icon: LayoutGrid,
        title: pageMetadata.treemap.title,
        description: pageMetadata.treemap.about.details,
        keepsTrackOf: pageMetadata.treemap.about.keepsTrackOf,
        features: pageMetadata.treemap.about.features,
      },
      {
        path: '/ring',
        icon: CircleDashed,
        title: pageMetadata.ring.title,
        description: pageMetadata.ring.about.details,
        keepsTrackOf: pageMetadata.ring.about.keepsTrackOf,
        features: pageMetadata.ring.about.features,
      },
      {
        path: '/kpigauge',
        icon: Gauge,
        title: pageMetadata.kpigauge.title,
        description: pageMetadata.kpigauge.about.details,
        keepsTrackOf: pageMetadata.kpigauge.about.keepsTrackOf,
        features: pageMetadata.kpigauge.about.features,
      },
    ],
  },
  {
    label: 'Stages',
    description: 'Focus on where tasks are in your workflow.',
    items: [
      {
        path: '/readiness',
        icon: ArrowBigRight,
        title: pageMetadata.readiness.title,
        description: pageMetadata.readiness.about.details,
        keepsTrackOf: pageMetadata.readiness.about.keepsTrackOf,
        features: pageMetadata.readiness.about.features,
      },
      {
        path: '/completed',
        icon: SquareCheck,
        title: pageMetadata.completed.title,
        description: pageMetadata.completed.about.details,
        keepsTrackOf: pageMetadata.completed.about.keepsTrackOf,
        features: pageMetadata.completed.about.features,
      },
    ],
  },
] as const satisfies ReadonlyArray<{
  label: string;
  description: string;
  items: readonly ViewEntry[];
}>;

function MetadataPill({ children }: { children: string }) {
  return (
    <span className='inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'>{children}</span>
  );
}

function MetadataRow({ label, values }: { label: string; values: readonly string[] }) {
  if (values.length === 0) return null;

  return (
    <div className='space-y-1.5'>
      <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>{label}</p>
      <div className='flex flex-wrap gap-1.5'>
        {values.map((value) => (
          <MetadataPill key={value}>{value}</MetadataPill>
        ))}
      </div>
    </div>
  );
}

function ViewCard({ path, icon: Icon, title, description, keepsTrackOf, features }: ViewEntry) {
  return (
    <Link to={path} className='group block'>
      <Card className={`transition-colors hover:bg-muted/40 ${cardClassName}`}>
        <CardHeader>
          <CardTitle className='flex items-center justify-between gap-3 text-base'>
            <span className='flex items-center gap-2'>
              <Icon className='h-4 w-4 text-muted-foreground' />
              {title}
            </span>
            <ChevronRight className='h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100' />
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <MetadataRow label='Tracks' values={keepsTrackOf.map((field) => trackedFieldLabels[field])} />
          <MetadataRow label='Features' values={features.map((feature) => viewFeatureLabels[feature])} />
        </CardContent>
      </Card>
    </Link>
  );
}

function RouteComponent() {
  return (
    <div className='mx-auto w-full max-w-2xl space-y-6 px-4 py-10'>
      <header className='space-y-3'>
        <h1 className='text-3xl font-bold tracking-tight'>What&apos;s in my mind</h1>
        <p className='text-lg text-muted-foreground'>One set of tasks, many ways to see them.</p>
        <div className='space-y-3 text-muted-foreground'>
          <p>
            Capture tasks once, then explore them through checklists, charts, gauges, and more. Every view reads from
            the same data — no duplication, no switching tools.
          </p>
        </div>
      </header>

      {viewGroups.map((group, groupIndex) => (
        <div key={group.label} className='space-y-3'>
          {groupIndex > 0 ? <Separator /> : null}
          <div className='space-y-1 px-1'>
            <h3 className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>{group.label}</h3>
            <p className='text-sm text-muted-foreground'>{group.description}</p>
          </div>
          <div className='space-y-3'>
            {group.items.map((view) => (
              <ViewCard key={view.path} {...view} />
            ))}
          </div>
        </div>
      ))}

      <Separator />

      <div className='space-y-3'>
        <div className='space-y-1 px-1'>
          <h3 className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>Settings</h3>
          <p className='text-sm text-muted-foreground'>Organize your tasks and personalize the application.</p>
        </div>
        <Link to='/settings' className='group block'>
          <Card className={`transition-colors hover:bg-muted/40 ${cardClassName}`}>
            <CardHeader>
              <CardTitle className='flex items-center justify-between gap-3 text-base'>
                <span className='flex items-center gap-2'>
                  <Settings2 className='h-4 w-4 text-muted-foreground' />
                  What you can configure
                </span>
                <ChevronRight className='h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100' />
              </CardTitle>
              <CardDescription>
                Signed-in users can manage categories. Theme and connection status are available to everyone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className='list-disc space-y-2 pl-5 text-sm text-muted-foreground'>
                <li>Create categories, rename or recolor them, and delete categories you no longer need.</li>
                <li>Choose a light, dark, or system theme.</li>
                <li>Check whether the application is connected to its server.</li>
              </ul>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Separator />

      <div className='space-y-3 px-1'>
        <h3 className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>Project page</h3>
        <p className='text-sm text-muted-foreground'>
          Built by{' '}
          <a
            href='https://github.com/tuokaikyle'
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center gap-0.5 underline underline-offset-2'
          >
            tuokaikyle
            <ExternalLink className='h-3 w-3' />
          </a>
          . Found a bug or have an idea? Open an issue on GitHub.
        </p>
        <Button asChild variant='outline'>
          <a href={REPO_URL} target='_blank' rel='noopener noreferrer'>
            <ExternalLink className='h-4 w-4' />
            View on GitHub
          </a>
        </Button>
      </div>
    </div>
  );
}
