import { createFileRoute } from '@tanstack/react-router';
import { type MotionValue, motion, motionValue, useTransform } from 'framer-motion';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { EditTodoForm } from '@/components/edit-todo-form';
import { EmptyState } from '@/components/empty-state';
import { GuestBanner } from '@/components/guest-banner';
import { PageLoader } from '@/components/page-loader';
import { TodoListPanelDrawer } from '@/components/todo-list-panel-drawer';
import { Button } from '@/components/ui/button';
import * as BaseDrawer from '@/components/ui/drawer-base';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCategories, useTodos } from '@/hooks/use-todos';
import { EFFORT_RANGE } from '@/utils/enums';
import type { Category, Task } from '@/utils/types';

export const Route = createFileRoute('/matrix')({ component: MatrixPage });

/**
 * Effort determines which quadrant a dot belongs to:
 *   1 -> top-left, 2 -> top-right, 3 -> bottom-left, 5 -> bottom-right.
 * Each dot is a small physics body that stays inside its effort quadrant.
 */

const DEFAULT_DOT_COLOR = '#6b8abc';
const DOT_SIZE_PX = 32;
const HEADER_HEIGHT_PX = 48;
const BOUNCE = 1;
// Larger effort -> bigger dot. Effort 1 keeps the original size;
// the rest scale up from there.
const DOT_SIZE_BY_EFFORT: Record<number, number> = {
  1: 36,
  2: 48,
  3: 60,
  5: 80,
};
function sizeForEffort(effort: number) {
  return DOT_SIZE_BY_EFFORT[effort] ?? DOT_SIZE_PX;
}

// Four distinct motion styles, one per quadrant, so each section shows a
// different way the dots can move.
type MotionStyle = 'billiards' | 'orbit' | 'wander' | 'pulse';

const BILLIARDS_SPEED = 16; // % of field per second
const ORBIT_ANGULAR_SPEED = 0.45; // rad/s
const WANDER_SPEED = 11; // % of field per second
const WANDER_TURN_RATE = 1.4; // rad/s wobble amplitude
const PULSE_ROTATE_SPEED = 0.18; // rad/s ring rotation
const PULSE_BREATHE_FREQ = 1.4; // rad/s breathing
const PULSE_AMPLITUDE_PCT = 4; // % of field radial breathing

type Quadrant = {
  effort: number;
  title: string;
  subtitle: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  motionStyle: MotionStyle;
  motionLabel: string;
};

type MatrixDot = {
  todo: Task;
  effort: number;
  color: string;
  categoryName: string;
  size: number;
  left: number;
  top: number;
};

type PhysicsBody = Omit<MatrixDot, 'todo' | 'color' | 'categoryName' | 'left' | 'top'> & {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  // Style-specific state
  homeX: number;
  homeY: number;
  centerX: number;
  centerY: number;
  angle: number;
  orbitRadius: number;
  angularSpeed: number;
  phase: number;
  freq: number;
};

const QUADRANTS: Quadrant[] = [
  {
    effort: 1,
    title: 'Effort 1',
    subtitle: 'Small',
    position: 'top-left',
    motionStyle: 'billiards',
    motionLabel: 'Billiards',
  },
  {
    effort: 2,
    title: 'Effort 2',
    subtitle: 'Light',
    position: 'top-right',
    motionStyle: 'orbit',
    motionLabel: 'Orbit',
  },
  {
    effort: 3,
    title: 'Effort 3',
    subtitle: 'Moderate',
    position: 'bottom-left',
    motionStyle: 'wander',
    motionLabel: 'Wander',
  },
  {
    effort: 5,
    title: 'Effort 5',
    subtitle: 'Large',
    position: 'bottom-right',
    motionStyle: 'pulse',
    motionLabel: 'Pulse',
  },
];

function colorForTodo(todo: Task, categoriesById: Map<number, Category>) {
  return (todo.categoryId != null ? categoriesById.get(todo.categoryId)?.color : null) ?? DEFAULT_DOT_COLOR;
}

function positionForIndex(index: number, count: number) {
  const columns = Math.max(1, Math.ceil(Math.sqrt(count)));
  const rows = Math.max(1, Math.ceil(count / columns));
  const column = index % columns;
  const row = Math.floor(index / columns);

  // Keep dots away from the quadrant title and the edges.
  const left = columns === 1 ? 50 : 16 + (column / (columns - 1)) * 68;
  const top = rows === 1 ? 54 : 30 + (row / (rows - 1)) * 54;

  return { left, top };
}

function buildDots(todos: Task[], categories: Category[]) {
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  const groupedTodos = new Map<number, Task[]>();

  for (const effort of EFFORT_RANGE) groupedTodos.set(effort, []);
  for (const todo of todos) {
    const effort = todo.effort ?? EFFORT_RANGE[0];
    const group = groupedTodos.get(effort) ?? groupedTodos.get(EFFORT_RANGE[0]);
    group?.push(todo);
  }

  return QUADRANTS.flatMap(({ effort }) => {
    const group = [...(groupedTodos.get(effort) ?? [])].sort((a, b) => a.id - b.id);

    return group.map((todo, index): MatrixDot => {
      const localPosition = positionForIndex(index, group.length);

      return {
        todo,
        effort,
        color: colorForTodo(todo, categoriesById),
        categoryName:
          todo.categoryId != null ? (categoriesById.get(todo.categoryId)?.name ?? 'Uncategorized') : 'Uncategorized',
        size: sizeForEffort(effort),
        left: localPosition.left,
        top: localPosition.top,
      };
    });
  });
}

function createPhysicsBodies(dots: MatrixDot[], width: number, height: number, style: MotionStyle): PhysicsBody[] {
  const headerHeightPct = (HEADER_HEIGHT_PX / height) * 100;
  const centerX = 50;
  const centerY = (headerHeightPct + 100) / 2;
  const count = dots.length;
  const speed = style === 'wander' ? WANDER_SPEED : BILLIARDS_SPEED;

  return dots.map((dot, index) => {
    const dotRadiusX = (dot.size / 2 / width) * 100;
    const dotRadiusY = (dot.size / 2 / height) * 100;
    const minX = dotRadiusX;
    const maxX = 100 - dotRadiusX;
    const minY = headerHeightPct + dotRadiusY;
    const maxY = 100 - dotRadiusY;

    const homeX = Math.max(minX, Math.min(maxX, dot.left));
    const homeY = Math.max(minY, Math.min(maxY, dot.top));

    const seed = ((dot.todo.id * 2_654_435_761) >>> 0) / 4_294_967_296;
    const angle = seed * Math.PI * 2;

    // Concentric orbit rings that fit inside the quadrant.
    const maxR = Math.min(centerX - minX, maxX - centerX, centerY - minY, maxY - centerY);
    const orbitRadius = count <= 1 ? maxR * 0.5 : maxR * (0.3 + 0.6 * (index / Math.max(1, count - 1)));

    return {
      id: dot.todo.id,
      effort: dot.effort,
      size: dot.size,
      x: homeX,
      y: homeY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      minX,
      maxX,
      minY,
      maxY,
      homeX,
      homeY,
      centerX,
      centerY,
      angle,
      orbitRadius,
      angularSpeed: ORBIT_ANGULAR_SPEED,
      phase: index * 0.9,
      freq: 0.6 + seed * 0.8,
    };
  });
}

function bounceOffWalls(body: PhysicsBody) {
  if (body.x <= body.minX) {
    body.x = body.minX;
    body.vx = Math.abs(body.vx) * BOUNCE;
  } else if (body.x >= body.maxX) {
    body.x = body.maxX;
    body.vx = -Math.abs(body.vx) * BOUNCE;
  }

  if (body.y <= body.minY) {
    body.y = body.minY;
    body.vy = Math.abs(body.vy) * BOUNCE;
  } else if (body.y >= body.maxY) {
    body.y = body.maxY;
    body.vy = -Math.abs(body.vy) * BOUNCE;
  }
}

function resolveCollision(
  a: PhysicsBody,
  b: PhysicsBody,
  width: number,
  height: number,
  pausedIds: ReadonlySet<number>,
) {
  if (a.effort !== b.effort) return;

  const aPaused = pausedIds.has(a.id);
  const bPaused = pausedIds.has(b.id);
  if (aPaused && bPaused) return;

  let dx = ((b.x - a.x) * width) / 100;
  let dy = ((b.y - a.y) * height) / 100;
  let distanceSquared = dx * dx + dy * dy;
  const minimumDistance = (a.size + b.size) / 2;

  if (distanceSquared >= minimumDistance * minimumDistance) return;

  if (distanceSquared === 0) {
    const angle = ((a.id * 17 + b.id * 31) % 360) * (Math.PI / 180);
    dx = Math.cos(angle) * 0.001;
    dy = Math.sin(angle) * 0.001;
    distanceSquared = dx * dx + dy * dy;
  }

  const distance = Math.sqrt(distanceSquared);
  const normalX = dx / distance;
  const normalY = dy / distance;
  const overlap = minimumDistance - distance;

  if (aPaused || bPaused) {
    if (aPaused) {
      b.x += (normalX * overlap * 100) / width;
      b.y += (normalY * overlap * 100) / height;
      const velocityAlongNormal = ((b.vx * width) / 100) * normalX + ((b.vy * height) / 100) * normalY;
      if (velocityAlongNormal < 0) {
        b.vx -= (2 * velocityAlongNormal * normalX * 100) / width;
        b.vy -= (2 * velocityAlongNormal * normalY * 100) / height;
      }
    } else {
      a.x -= (normalX * overlap * 100) / width;
      a.y -= (normalY * overlap * 100) / height;
      const velocityAlongNormal = ((a.vx * width) / 100) * normalX + ((a.vy * height) / 100) * normalY;
      if (velocityAlongNormal > 0) {
        a.vx -= (2 * velocityAlongNormal * normalX * 100) / width;
        a.vy -= (2 * velocityAlongNormal * normalY * 100) / height;
      }
    }
    return;
  }

  a.x -= (normalX * overlap * 50) / width;
  a.y -= (normalY * overlap * 50) / height;
  b.x += (normalX * overlap * 50) / width;
  b.y += (normalY * overlap * 50) / height;

  const relativeVelocityX = ((b.vx - a.vx) * width) / 100;
  const relativeVelocityY = ((b.vy - a.vy) * height) / 100;
  const velocityAlongNormal = relativeVelocityX * normalX + relativeVelocityY * normalY;

  if (velocityAlongNormal > 0) return;

  const impulse = (-(1 + BOUNCE) * velocityAlongNormal) / 2;
  a.vx -= (impulse * normalX * 100) / width;
  a.vy -= (impulse * normalY * 100) / height;
  b.vx += (impulse * normalX * 100) / width;
  b.vy += (impulse * normalY * 100) / height;
}

function resolveCollisions(bodies: PhysicsBody[], width: number, height: number, pausedIds: ReadonlySet<number>) {
  for (let first = 0; first < bodies.length; first++) {
    for (let second = first + 1; second < bodies.length; second++) {
      resolveCollision(bodies[first], bodies[second], width, height, pausedIds);
    }
  }
}

function maintainSpeed(body: PhysicsBody) {
  const targetSpeed = BILLIARDS_SPEED;
  const speed = Math.hypot(body.vx, body.vy);
  if (speed === 0) {
    body.vx = targetSpeed;
    body.vy = 0;
    return;
  }

  body.vx = (body.vx / speed) * targetSpeed;
  body.vy = (body.vy / speed) * targetSpeed;
}

function MatrixDotField({
  dots,
  motionStyle,
  onClick,
}: {
  dots: MatrixDot[];
  motionStyle: MotionStyle;
  onClick: (todoId: number) => void;
}) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const pausedIdsRef = useRef(new Set<number>());
  const [fieldSize, setFieldSize] = useState({ width: 0, height: 0 });
  const motionById = useMemo(() => {
    const values = new Map<number, { x: MotionValue<number>; y: MotionValue<number> }>();
    for (const dot of dots)
      values.set(dot.todo.id, {
        x: motionValue(dot.left),
        y: motionValue(dot.top),
      });
    return values;
  }, [dots]);

  const allIds = useMemo(() => dots.map((dot) => dot.todo.id), [dots]);

  // Pausing is scoped to the whole quadrant: when the cursor (or focus)
  // enters the field, every dot in this quadrant stops moving.
  const handleEnter = () => {
    for (const id of allIds) pausedIdsRef.current.add(id);
  };
  const handleLeave = () => {
    for (const id of allIds) pausedIdsRef.current.delete(id);
  };

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;

    const updateSize = () => {
      const rect = field.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setFieldSize({ width: rect.width, height: rect.height });
      }
    };

    const observer = new ResizeObserver(updateSize);
    observer.observe(field);
    updateSize();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (fieldSize.width <= 0 || fieldSize.height <= 0) return;

    const bodies = createPhysicsBodies(dots, fieldSize.width, fieldSize.height, motionStyle);

    for (const body of bodies) {
      motionById.get(body.id)?.x.set(body.x);
      motionById.get(body.id)?.y.set(body.y);
    }

    let frameId = 0;
    let previousTime = performance.now();

    const tick = (time: number) => {
      const deltaTime = Math.min((time - previousTime) / 1000, 0.032);
      previousTime = time;
      const t = time / 1000;

      for (const body of bodies) {
        if (pausedIdsRef.current.has(body.id)) continue;

        switch (motionStyle) {
          case 'billiards': {
            body.x += body.vx * deltaTime;
            body.y += body.vy * deltaTime;
            bounceOffWalls(body);
            break;
          }
          case 'orbit': {
            body.angle += body.angularSpeed * deltaTime;
            body.x = body.centerX + Math.cos(body.angle) * body.orbitRadius;
            body.y = body.centerY + Math.sin(body.angle) * body.orbitRadius;
            break;
          }
          case 'wander': {
            // Smoothly rotate the heading for a meandering path.
            const turn = Math.sin(t * 0.9 * body.freq + body.phase) * WANDER_TURN_RATE;
            const c = Math.cos(turn * deltaTime);
            const s = Math.sin(turn * deltaTime);
            const nvx = body.vx * c - body.vy * s;
            const nvy = body.vx * s + body.vy * c;
            const sp = Math.hypot(nvx, nvy) || 1;
            body.vx = (nvx / sp) * WANDER_SPEED;
            body.vy = (nvy / sp) * WANDER_SPEED;
            body.x += body.vx * deltaTime;
            body.y += body.vy * deltaTime;
            bounceOffWalls(body);
            break;
          }
          case 'pulse': {
            // Rotate the home ring slowly and breathe radially in unison.
            const rot = t * PULSE_ROTATE_SPEED;
            const breathe = Math.sin(t * PULSE_BREATHE_FREQ + body.phase);
            const dx0 = body.homeX - body.centerX;
            const dy0 = body.homeY - body.centerY;
            const cR = Math.cos(rot);
            const sR = Math.sin(rot);
            let rx = dx0 * cR - dy0 * sR;
            let ry = dx0 * sR + dy0 * cR;
            const len = Math.hypot(rx, ry) || 1;
            rx += (rx / len) * breathe * PULSE_AMPLITUDE_PCT;
            ry += (ry / len) * breathe * PULSE_AMPLITUDE_PCT;
            body.x = body.centerX + rx;
            body.y = body.centerY + ry;
            break;
          }
        }
      }

      if (motionStyle === 'billiards') {
        resolveCollisions(bodies, fieldSize.width, fieldSize.height, pausedIdsRef.current);
        for (const body of bodies) {
          if (pausedIdsRef.current.has(body.id)) continue;
          bounceOffWalls(body);
          maintainSpeed(body);
        }
      }

      for (const body of bodies) {
        if (pausedIdsRef.current.has(body.id)) continue;
        motionById.get(body.id)?.x.set(body.x);
        motionById.get(body.id)?.y.set(body.y);
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [dots, fieldSize, motionById, motionStyle]);

  return (
    <>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: hover/focus only pauses the animation, no interactive action */}
      <div
        ref={fieldRef}
        className='absolute inset-0'
        onPointerEnter={handleEnter}
        onPointerLeave={handleLeave}
        onFocus={handleEnter}
        onBlur={handleLeave}
      >
        {dots.map((dot) => {
          const motion = motionById.get(dot.todo.id);
          if (!motion) return null;

          return <AnimatedMatrixDot key={dot.todo.id} dot={dot} motionValues={motion} onClick={onClick} />;
        })}
      </div>
    </>
  );
}

function AnimatedMatrixDot({
  dot,
  motionValues,
  onClick,
}: {
  dot: MatrixDot;
  motionValues: { x: MotionValue<number>; y: MotionValue<number> };
  onClick: (todoId: number) => void;
}) {
  const left = useTransform(motionValues.x, (value) => `${value}%`);
  const top = useTransform(motionValues.y, (value) => `${value}%`);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          type='button'
          aria-label={`Edit ${dot.todo.text}, effort ${dot.effort}`}
          className='pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-background shadow-sm outline-none'
          style={{ left, top, backgroundColor: dot.color, width: dot.size, height: dot.size }}
          onClick={() => onClick(dot.todo.id)}
        />
      </TooltipTrigger>
      <TooltipContent side='top'>
        <div className='space-y-0.5'>
          <p className='font-medium'>{dot.todo.text}</p>
          <p>
            Effort {dot.effort} · {dot.categoryName}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function MatrixPage() {
  const { todos, todosLoading, updateMutation, deleteMutation, isGuest } = useTodos();
  const { categories } = useCategories();
  const [listPanelOpen, setListPanelOpen] = useState(false);
  const [selectedTodoId, setSelectedTodoId] = useState<number | null>(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  const dots = useMemo(() => buildDots(todos, categories), [categories, todos]);
  const dotsByEffort = useMemo(() => {
    const grouped = new Map<number, MatrixDot[]>();
    for (const effort of EFFORT_RANGE) grouped.set(effort, []);
    for (const dot of dots) grouped.get(dot.effort)?.push(dot);
    return grouped;
  }, [dots]);
  const legendItems = useMemo(() => {
    const categoriesById = new Map(categories.map((category) => [category.id, category]));
    const usedCategoryIds = new Set<number>();
    let hasUncategorized = false;

    for (const todo of todos) {
      if (todo.categoryId != null && categoriesById.has(todo.categoryId)) {
        usedCategoryIds.add(todo.categoryId);
      } else {
        hasUncategorized = true;
      }
    }

    const items = categories
      .filter((category) => usedCategoryIds.has(category.id))
      .map((category) => ({
        id: `category-${category.id}`,
        name: category.name,
        color: category.color ?? DEFAULT_DOT_COLOR,
      }));

    if (hasUncategorized) {
      items.push({
        id: 'uncategorized',
        name: 'Uncategorized',
        color: DEFAULT_DOT_COLOR,
      });
    }

    return items;
  }, [categories, todos]);
  const selectedTodo = selectedTodoId == null ? null : (todos.find((todo) => todo.id === selectedTodoId) ?? null);

  const openTodo = (todoId: number) => {
    setListPanelOpen(false);
    setSelectedTodoId(todoId);
    setEditDrawerOpen(true);
  };

  const handleListPanelOpenChange = (open: boolean) => {
    setListPanelOpen(open);
    if (open) setEditDrawerOpen(false);
  };

  return (
    <div className='mx-auto w-full max-w-4xl space-y-7 px-4 py-8 sm:py-10'>
      <div className='space-y-2'>
        <h1 className='text-xl font-semibold tracking-tight text-foreground sm:text-2xl'>Matrix</h1>
        <p className='max-w-xl text-sm text-muted-foreground'>
          Tasks grouped by effort. Hover a quadrant to pause its dots and view details; select a dot to edit.
        </p>
      </div>

      {isGuest && <GuestBanner />}

      {todosLoading ? (
        <PageLoader size='lg' />
      ) : todos.length === 0 ? (
        <EmptyState title='No todos yet' description='Add items in the Simple view to see them here.' />
      ) : (
        <div className='mx-auto w-full max-w-[min(100%,calc(100vh-12rem))]'>
          <section
            className='relative grid aspect-[1/4] grid-cols-1 grid-rows-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm sm:aspect-square sm:grid-cols-2 sm:grid-rows-2'
            aria-label='Todo effort matrix'
          >
            {QUADRANTS.map((quadrant) => (
              <QuadrantCell key={quadrant.effort} quadrant={quadrant}>
                <MatrixDotField
                  dots={dotsByEffort.get(quadrant.effort) ?? []}
                  motionStyle={quadrant.motionStyle}
                  onClick={openTodo}
                />
              </QuadrantCell>
            ))}
          </section>

          <section className='mt-5 space-y-2 px-1' aria-label='Category legend'>
            <p className='text-center text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70'>
              Categories
            </p>
            <div className='flex w-full flex-wrap justify-center gap-x-4 gap-y-2'>
              {legendItems.map((item) => (
                <div key={item.id} className='flex items-center gap-1.5 text-sm text-muted-foreground'>
                  <span
                    className='inline-block h-3 w-3 shrink-0 rounded-full ring-1 ring-border'
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      <div className='flex justify-center pt-1'>
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
      </div>

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
            <BaseDrawer.DrawerHeader>
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
                      onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to update todo'),
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
  );
}

function QuadrantCell({ quadrant, children }: { quadrant: Quadrant; children: ReactNode }) {
  const dividerClass =
    quadrant.position === 'top-left'
      ? 'border-b sm:border-r'
      : quadrant.position === 'top-right'
        ? 'border-b'
        : quadrant.position === 'bottom-left'
          ? 'border-b sm:border-b-0 sm:border-r'
          : '';

  return (
    <div className={`relative min-h-0 border-border bg-card/80 ${dividerClass}`}>
      <div className='absolute inset-x-0 top-0 z-10 flex h-12 flex-col justify-center border-b border-border/80 bg-muted/10 px-3'>
        <div className='flex items-center justify-between'>
          <p className='text-sm font-semibold text-foreground'>{quadrant.title}</p>
          <p className='text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70'>
            {quadrant.motionLabel}
          </p>
        </div>
        <p className='text-xs text-muted-foreground'>{quadrant.subtitle}</p>
      </div>
      {children}
    </div>
  );
}
