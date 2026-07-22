import { createFileRoute } from '@tanstack/react-router';
import * as Highcharts from 'highcharts';
import { useMemo, useState } from 'react';
import 'highcharts/highcharts-more';
import HighchartsReact from 'highcharts-react-official';
import { GuestBanner } from '@/components/guest-banner';
import { PageLoader } from '@/components/page-loader';
import { useTheme } from '@/components/theme-provider';
import { TodoListPanel } from '@/components/todo-list-panel';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { useTodos } from '@/hooks/use-todos';
import { EFFORT_RANGE } from '@/utils/enums';
import type { Task } from '@/utils/types';

export const Route = createFileRoute('/gauge')({
  component: GaugePage,
});

function buildGaugeOptions(
  todo: Task,
  isDark: boolean,
  name: string
): Highcharts.Options {
  const textColor = isDark ? '#f5f5f5' : '#171717';
  const mutedColor = isDark ? '#a3a3a3' : '#737373';
  const trackColor = isDark ? '#262626' : '#e5e5e5';
  const effort = todo.effort ?? EFFORT_RANGE[0];
  const rawProgress = Math.max(0, Math.min(effort, todo.progress ?? 0));
  const progress = Math.round((rawProgress / effort) * 100);

  const progressColor = '#10b981';

  return {
    chart: {
      type: 'gauge',
      height: '240px',
      backgroundColor: 'transparent',
      style: {
        fontFamily: 'Inter, Geist, ui-sans-serif, system-ui, sans-serif',
      },
      spacing: [10, 20, 10, 20], // Padding to ensure outside numbers aren't cut off
    },
    title: {
      text: undefined,
    },
    subtitle: {
      text: name,
      align: 'center',
      verticalAlign: 'bottom',
      y: 4,
      style: {
        color: textColor,
        fontSize: '16px',
      },
    },
    pane: {
      startAngle: -125,
      endAngle: 125,
      background: [
        {
          // The background track for the meter (inner band)
          backgroundColor: trackColor,
          borderWidth: 0,
          outerRadius: '100%',
          innerRadius: '78%',
          shape: 'arc',
          borderRadius: '50%',
        },
      ],
    } as unknown as Highcharts.PaneOptions,
    yAxis: {
      min: 0,
      max: 100,
      // Explicitly define where the numbers appear
      tickPositions: [0, 20, 40, 60, 80, 100],
      tickColor: mutedColor,
      tickLength: 8,
      tickWidth: 2,
      // Add minor ticks for that classic instrument cluster look
      minorTickInterval: 5,
      minorTickLength: 4,
      minorTickWidth: 1,
      minorTickColor: mutedColor,
      offset: -25,
      // lineWidth: 0,
      gridLineWidth: 0,
      labels: {
        // Pushes the numbers outside the 100% radius
        distance: 40,
        style: {
          color: mutedColor,
          fontSize: '11px',
          fontFamily: 'Inter, Geist, ui-sans-serif, system-ui, sans-serif',
        },
      },
      plotBands: [
        {
          // Full background track (gray)
          from: 0,
          to: 100,
          color: trackColor,
          outerRadius: '100%',
          innerRadius: '78%',
          borderWidth: 0,
          borderRadius: '50%',
        },
        {
          // Progress track (colored)
          from: 0,
          to: progress,
          color: progressColor,
          outerRadius: '100%',
          innerRadius: '78%',
          borderWidth: 0,
          borderRadius: '50%',
        },
      ],
    },
    series: [
      {
        name: 'Progress',
        data: [progress],
        tooltip: { valueSuffix: '%' },
        // The Needle
        dial: {
          radius: '55%',
          // backgroundColor: textColor,
          // baseWidth: 6,
          // topWidth: 1,
          // baseLength: '10%',
          // rearLength: '0%',
          // borderColor: 'transparent',
          // borderWidth: 0,
        },
        // The center hub of the needle
        pivot: {
          radius: 6,
          backgroundColor: textColor,
          borderColor: isDark ? '#262626' : '#ffffff',
          borderWidth: 2,
        },
        dataLabels: {
          enabled: true,
          format:
            '<span style="font-size:28px;font-weight:700;letter-spacing:-0.03em;color:' +
            textColor +
            '">{y}%</span>',
          y: 45, // Position text below the needle hub
          borderWidth: 0,
          useHTML: true,
          backgroundColor: 'transparent',
          shadow: false,
        },
      } as Highcharts.SeriesOptionsType,
    ],
    credits: { enabled: false },
    xAxis: {
      visible: false,
    },
    plotOptions: {
      gauge: {
        dataLabels: { borderWidth: 0 },
      },
    },
  };
}

function GaugePage() {
  const { todos, todosLoading, isGuest } = useTodos();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const textColor = isDark ? '#f5f5f5' : '#171717';
  const mutedColor = isDark ? '#a3a3a3' : '#737373';

  const activeTodos = useMemo(
    () =>
      todos.filter((t) => (t.progress ?? 0) < (t.effort ?? EFFORT_RANGE[0])),
    [todos]
  );

  return (
    <div className='mx-auto w-full max-w-4xl space-y-6 px-4 py-10'>
      {isGuest && <GuestBanner />}

      {todosLoading ? (
        <PageLoader size='lg' />
      ) : activeTodos.length === 0 ? (
        <div className='flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center'>
          <p className='text-lg font-medium text-foreground'>
            No tasks in progress
          </p>
          <p className='mt-1 text-sm text-muted-foreground'>
            Complete some tasks or add new ones to see them here.
          </p>
        </div>
      ) : (
        <>
          <div className='mb-6'>
            <h1 className='text-lg font-semibold' style={{ color: textColor }}>
              Progress Gauges
            </h1>
            <p className='text-sm' style={{ color: mutedColor }}>
              Each gauge shows completion progress for an active task.
            </p>
          </div>
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {activeTodos.map((todo) => {
              return (
                <div key={todo.id} className='flex flex-col items-center'>
                  <HighchartsReact
                    highcharts={Highcharts}
                    options={buildGaugeOptions(todo, isDark, todo.text)}
                  />
                </div>
              );
            })}
          </div>

          <div className='flex justify-center'>
            <TodoEditorDrawerDemo />
          </div>
        </>
      )}
    </div>
  );
}

function TodoEditorDrawerDemo() {
  const [editorPanelOpen, setEditorPanelOpen] = useState(false);
  const [nestedEditorOpen, setNestedEditorOpen] = useState(false);

  const handleEditorPanelOpenChange = (open: boolean) => {
    setEditorPanelOpen(open);
    if (!open) setNestedEditorOpen(false);
  };

  return (
    <Drawer
      modal={false}
      direction='right'
      open={editorPanelOpen}
      onOpenChange={handleEditorPanelOpenChange}
    >
      <DrawerTrigger asChild>
        <Button variant='secondary'>Show item editor panel</Button>
      </DrawerTrigger>
      <DrawerContent
        className={cn(
          'data-[vaul-drawer-direction=right]:w-72',
          nestedEditorOpen &&
            'origin-right !-translate-x-5 !scale-[0.97] transition-transform duration-300 ease-out',
        )}
      >
        <TodoListPanel
          enableNestedEdit
          onNestedEditOpenChange={setNestedEditorOpen}
        />
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant='outline'>Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
