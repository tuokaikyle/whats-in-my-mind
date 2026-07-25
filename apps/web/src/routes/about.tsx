import { createFileRoute, Link } from '@tanstack/react-router';
import { ExternalLink, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/about')({
  component: RouteComponent,
});

const REPO_URL = 'https://github.com/tuokaikyle/whats-in-my-mind';

function RouteComponent() {
  return (
    <div className='mx-auto w-full max-w-2xl py-10 space-y-8'>
      <div className='space-y-2'>
        <h1 className='text-3xl font-bold tracking-tight'>About</h1>
        <p className='text-muted-foreground text-lg'>One model, multiple views.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What is this?</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 text-muted-foreground'>
          <p>
            <strong>What's in my mind</strong> is a task management app that lets you capture your thoughts and
            visualize them in different ways — all from the same underlying data.
          </p>
          <p>
            Instead of forcing you into a single view, it offers multiple perspectives so you can work the way you
            think:
          </p>
          <ul className='list-disc pl-5 space-y-1'>
            <li>
              <Link to='/simple' className='text-primary hover:underline font-medium'>
                Simple
              </Link>{' '}
              — A clean, draggable checklist for quick capture and reordering.
            </li>
            <li>
              <Link to='/progress' className='text-primary hover:underline font-medium'>
                Progress
              </Link>{' '}
              — Track effort and completion with progress bars.
            </li>
            <li>
              <Link to='/bubble' className='text-primary hover:underline font-medium'>
                Bubble
              </Link>{' '}
              — See your tasks as a bubble chart by category and effort.
            </li>
            <li>
              <Link to='/gauge' className='text-primary hover:underline font-medium'>
                Gauge
              </Link>{' '}
              — At-a-glance radial gauge showing overall progress.
            </li>
            <li>
              <Link to='/treemap' className='text-primary hover:underline font-medium'>
                Tree Map
              </Link>{' '}
              — Explore tasks organized by category in a space-filling layout.
            </li>
          </ul>
          <p>Same tasks, different lenses. No duplication, no switching tools.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <GitBranch className='h-5 w-5' />
            Project page
          </CardTitle>
          <CardDescription>
            This project is built and open sourced by{' '}
            <a
              href='https://github.com/tuokaikyle'
              target='_blank'
              rel='noopener noreferrer'
              className='underline inline-flex items-center gap-0.5'
            >
              tuokaikyle
              <ExternalLink className='h-3 w-3' />
            </a>
            . Found a bug or have a feature idea? Open an issue and let us know.
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-3 sm:flex-row'>
          <Button asChild variant='outline' className='flex-1'>
            <a href={REPO_URL} target='_blank' rel='noopener noreferrer'>
              <ExternalLink className='h-4 w-4' />
              View on GitHub
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
