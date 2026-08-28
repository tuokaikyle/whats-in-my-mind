import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EditTodoForm } from '@/components/edit-todo-form';
import { EmptyState } from '@/components/empty-state';
import { GuestBanner } from '@/components/guest-banner';
import { PageLoader } from '@/components/page-loader';
import { RingChart } from '@/components/ring-chart';
import { TodoListPanelDrawer } from '@/components/todo-list-panel-drawer';
import { Button } from '@/components/ui/button';
import * as BaseDrawer from '@/components/ui/drawer-base';
import { useCountUp } from '@/hooks/use-count-up';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCategories, useTodos } from '@/hooks/use-todos';
import { EFFORT_RANGE } from '@/utils/enums';
import {
  buildSegments,
  getRingSegmentStyle,
  HIT_STROKE_WIDTH,
  RING_RADIUS,
  RING_STROKE_WIDTH,
  type RingGeometry,
  type RingSummary,
} from '@/utils/ring-geometry';

export const Route = createFileRoute('/ring')({
  component: RingPage,
});

function RingPage() {
  const { todos, todosLoading, isGuest, updateMutation, deleteMutation } = useTodos();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const isMobile = useIsMobile();

  const activeTodos = useMemo(() => todos.filter((t) => (t.progress ?? 0) < (t.effort ?? EFFORT_RANGE[0])), [todos]);

  const totalEffort = useMemo(
    () => activeTodos.reduce((sum, t) => sum + (t.effort ?? EFFORT_RANGE[0]), 0),
    [activeTodos],
  );

  const geometry: RingGeometry = useMemo(() => {
    const radius = RING_RADIUS;
    const strokeWidth = RING_STROKE_WIDTH;
    const circumference = 2 * Math.PI * radius;
    const viewBoxSize = (radius + strokeWidth) * 2;
    return {
      radius,
      strokeWidth,
      hitStrokeWidth: isMobile ? HIT_STROKE_WIDTH + 14 : HIT_STROKE_WIDTH,
      circumference,
      viewBoxSize,
      center: viewBoxSize / 2,
    };
  }, [isMobile]);

  const segmentStyle = useMemo(
    () => getRingSegmentStyle(activeTodos.length, geometry.circumference, geometry.strokeWidth),
    [activeTodos.length, geometry.circumference, geometry.strokeWidth],
  );

  const segments = useMemo(
    () => buildSegments(activeTodos, categories, totalEffort, geometry.circumference, segmentStyle.gap),
    [activeTodos, categories, totalEffort, geometry.circumference, segmentStyle.gap],
  );

  const ringSummary: RingSummary = useMemo(() => {
    const totalProgress = segments.reduce((sum, seg) => sum + seg.progress, 0);
    const overallRatio = totalEffort > 0 ? totalProgress / totalEffort : 0;
    return { totalProgress, overallRatio, todoCount: segments.length };
  }, [segments, totalEffort]);

  const [replayKey, setReplayKey] = useState(0);
  const [trackHidden, setTrackHidden] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);

  // Drawer state
  const [listPanelOpen, setListPanelOpen] = useState(false);
  const [selectedTodoId, setSelectedTodoId] = useState<number | null>(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  const selectedTodo = selectedTodoId != null ? (todos.find((t) => t.id === selectedTodoId) ?? null) : null;

  const openEditDrawer = (id: number) => {
    setListPanelOpen(false);
    setSelectedTodoId(id);
    setEditDrawerOpen(true);
  };

  const handleSegmentActivate = (id: number) => {
    if (isMobile) {
      if (activeId === id) {
        openEditDrawer(id);
        return;
      }
      setActiveId(id);
      return;
    }
    openEditDrawer(id);
  };

  const handleListPanelOpenChange = (open: boolean) => {
    setListPanelOpen(open);
    if (open) setEditDrawerOpen(false);
  };

  const displayId = hoveredId ?? activeId;
  const displaySegment = displayId != null ? (segments.find((seg) => seg.id === displayId) ?? null) : null;
  const displayRatio = displaySegment ? displaySegment.progressRatio : ringSummary.overallRatio;
  const animatedRatio = useCountUp(displayRatio, { replayKey });

  return (
    <div className='mx-auto w-full max-w-4xl space-y-6 px-4 py-10'>
      {isGuest && <GuestBanner />}

      {todosLoading || categoriesLoading ? (
        <PageLoader size='lg' />
      ) : activeTodos.length === 0 ? (
        <EmptyState
          title={todos.length === 0 ? 'No todos yet' : 'No tasks in progress'}
          description='Add items in the Simple view to see them here.'
        />
      ) : (
        <>
          <div className='mb-6 w-full'>
            <h1 className='text-lg font-semibold text-foreground'>Ring</h1>
            <p className='text-sm text-muted-foreground'>Each arc is a task; length is effort, fill is progress.</p>
          </div>

          <div className='flex flex-col items-center gap-6'>
            <div className='flex items-center gap-2'>
              <Button variant='outline' size='sm' onClick={() => setTrackHidden((v) => !v)}>
                {trackHidden ? 'Show track' : 'Hide track'}
              </Button>
              <Button variant='outline' size='sm' onClick={() => setReplayKey((k) => k + 1)}>
                Replay
              </Button>
            </div>

            <RingChart
              segments={segments}
              geometry={geometry}
              segmentStyle={segmentStyle}
              replayKey={replayKey}
              trackHidden={trackHidden}
              hoveredId={hoveredId}
              activeId={activeId}
              displaySegment={displaySegment}
              animatedRatio={animatedRatio}
              ringSummary={ringSummary}
              totalEffort={totalEffort}
              isMobile={isMobile}
              onHighlight={setHoveredId}
              onClearHighlight={() => setHoveredId(null)}
              onActivate={handleSegmentActivate}
              onDeselect={() => setActiveId(null)}
            />
          </div>

          <div className='flex justify-center'>
            <BaseDrawer.Drawer
              swipeDirection='right'
              modal={false}
              open={listPanelOpen}
              onOpenChange={handleListPanelOpenChange}
            >
              <BaseDrawer.DrawerTrigger
                render={<Button variant='secondary'>{listPanelOpen ? 'Hide panel' : 'Show panel'}</Button>}
              />
              <BaseDrawer.DrawerContent>
                <BaseDrawer.DrawerHeader>
                  <BaseDrawer.DrawerTitle>Todos</BaseDrawer.DrawerTitle>
                  <BaseDrawer.DrawerDescription>
                    Click an item&apos;s edit icon to open a nested drawer.
                  </BaseDrawer.DrawerDescription>
                </BaseDrawer.DrawerHeader>
                <div className='flex-1 overflow-hidden'>
                  <TodoListPanelDrawer />
                </div>
                <BaseDrawer.DrawerFooter>
                  <BaseDrawer.DrawerClose render={<Button variant='outline'>Close</Button>} />
                </BaseDrawer.DrawerFooter>
              </BaseDrawer.DrawerContent>
            </BaseDrawer.Drawer>

            <BaseDrawer.Drawer
              swipeDirection='right'
              modal={false}
              open={editDrawerOpen}
              onOpenChange={setEditDrawerOpen}
              onOpenChangeComplete={(open) => {
                if (!open) setSelectedTodoId(null);
              }}
            >
              {selectedTodo && (
                <BaseDrawer.DrawerContent>
                  <BaseDrawer.DrawerHeader className='border-b'>
                    <BaseDrawer.DrawerTitle>Edit Todo</BaseDrawer.DrawerTitle>
                    <BaseDrawer.DrawerDescription>Update this item&apos;s details.</BaseDrawer.DrawerDescription>
                  </BaseDrawer.DrawerHeader>
                  <div className='flex-1 overflow-y-auto p-4'>
                    <EditTodoForm
                      key={selectedTodo.id}
                      todo={selectedTodo}
                      categories={categories}
                      isUpdating={updateMutation.isPending}
                      onUpdate={(data) =>
                        updateMutation.mutate(
                          { id: selectedTodo.id, ...data },
                          {
                            onSuccess: () => setEditDrawerOpen(false),
                            onError: (error) =>
                              toast.error(error instanceof Error ? error.message : 'Failed to update todo'),
                          },
                        )
                      }
                      onDelete={() => {
                        deleteMutation.mutate({ id: selectedTodo.id });
                        setEditDrawerOpen(false);
                      }}
                      onClose={() => setEditDrawerOpen(false)}
                    />
                  </div>
                </BaseDrawer.DrawerContent>
              )}
            </BaseDrawer.Drawer>
          </div>
        </>
      )}
    </div>
  );
}
