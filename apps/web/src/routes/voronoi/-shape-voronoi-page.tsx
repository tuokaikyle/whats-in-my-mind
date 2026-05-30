import { Delaunay } from 'd3-delaunay';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AddCategory } from '@/components/add-category';
import { AddTaskDrawer } from '@/components/add-task-drawer';
import { PageLoader } from '@/components/page-loader';
import { useCategories, useTodos } from '@/hooks/use-todos';
import { cn } from '@/lib/utils';
import type { Task, TodoMetadata } from '@/utils/types';

type Seed = { id: number; x: number; y: number; text: string; color: string };

type ShapeData = {
  pathData: string;
  viewBoxWidth: number;
  viewBoxHeight: number;
};

type VoronoiMetadataKey = 'headSide' | 'brain' | 'shirt' | 'rectangular' | 'headSimple';

type ShapeVoronoiPageProps = {
  svgRaw: string;
  metadataKey: VoronoiMetadataKey;
  title: string;
  description: string;
  showCanvasBorder?: boolean;
  contentClassName?: string;
  afterCanvas?: React.ReactNode;
};

const WIDTH = 800;
const HEIGHT = 500;
const SEED_RADIUS = 6;
const SHAPE_PADDING = 20;

const parseShapeData = (svgText: string): ShapeData => {
  const pathMatch = svgText.match(/<path[\s\S]*?d="([^"]+)"/);
  const viewBoxMatch = svgText.match(/viewBox="([^"]+)"/);
  const viewBoxParts = viewBoxMatch?.[1]
    ?.trim()
    .split(/\s+/)
    .map((value) => Number.parseFloat(value));
  const viewBoxWidth =
    viewBoxParts && viewBoxParts.length === 4 && Number.isFinite(viewBoxParts[2])
      ? viewBoxParts[2]
      : 1;
  const viewBoxHeight =
    viewBoxParts && viewBoxParts.length === 4 && Number.isFinite(viewBoxParts[3])
      ? viewBoxParts[3]
      : 1;

  return {
    pathData: (pathMatch?.[1] ?? '').replace(/\s+/g, ' ').trim(),
    viewBoxWidth,
    viewBoxHeight,
  };
};

const makeSeed = (
  id: number,
  text: string,
  color: string,
  position: { x: number; y: number },
): Seed => ({
  id,
  text,
  color,
  x: position.x,
  y: position.y,
});

const getSavedPosition = (
  metadata: Task['metadata'],
  metadataKey: VoronoiMetadataKey,
) => {
  const entry = metadata?.voronoi?.[metadataKey];
  if (!entry || typeof entry !== 'object') return null;
  const maybePoint = entry as { x?: unknown; y?: unknown };
  if (typeof maybePoint.x !== 'number' || typeof maybePoint.y !== 'number') {
    return null;
  }
  if (!Number.isFinite(maybePoint.x) || !Number.isFinite(maybePoint.y)) {
    return null;
  }
  return {
    x: Math.max(0, Math.min(WIDTH, maybePoint.x)),
    y: Math.max(0, Math.min(HEIGHT, maybePoint.y)),
  };
};

export function ShapeVoronoiPage({
  svgRaw,
  metadataKey,
  title,
  description,
  showCanvasBorder = true,
  contentClassName,
  afterCanvas,
}: ShapeVoronoiPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initializedSeedIdsRef = useRef<Set<number>>(new Set());
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const { todos, todosLoading, createMutation, updateMutation, isGuest } =
    useTodos();
  const { categories } = useCategories();
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const shapeData = useMemo(() => parseShapeData(svgRaw), [svgRaw]);

  const hitTestCtx = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    return canvas.getContext('2d');
  }, []);

  const shapePath = useMemo(() => {
    if (!shapeData.pathData) return null;
    const rawPath = new Path2D(shapeData.pathData);
    const scale = Math.min(
      (WIDTH - SHAPE_PADDING * 2) / shapeData.viewBoxWidth,
      (HEIGHT - SHAPE_PADDING * 2) / shapeData.viewBoxHeight,
    );
    const offsetX = (WIDTH - shapeData.viewBoxWidth * scale) / 2;
    const offsetY = (HEIGHT - shapeData.viewBoxHeight * scale) / 2;
    const transformedPath = new Path2D();
    transformedPath.addPath(
      rawPath,
      new DOMMatrix().translate(offsetX, offsetY).scale(scale),
    );
    return transformedPath;
  }, [shapeData]);

  const isInsideShape = useCallback(
    (x: number, y: number) => {
      if (!shapePath || !hitTestCtx) return true;
      return hitTestCtx.isPointInPath(shapePath, x, y);
    },
    [shapePath, hitTestCtx],
  );

  const randomPointInShape = useCallback(() => {
    for (let i = 0; i < 500; i++) {
      const x = 40 + Math.random() * (WIDTH - 80);
      const y = 40 + Math.random() * (HEIGHT - 80);
      if (isInsideShape(x, y)) return { x, y };
    }
    return { x: WIDTH / 2, y: HEIGHT / 2 };
  }, [isInsideShape]);

  useEffect(() => {
    setSeeds((prev) => {
      const prevById = new Map(prev.map((seed) => [seed.id, seed]));
      return todos.map((todo) => {
        const existing = prevById.get(todo.id);
        const color =
          categories.find((category) => category.id === todo.categoryId)
            ?.color ?? '#d1d5db';
        if (existing) return { ...existing, text: todo.text, color };

        const savedPosition = isGuest
          ? null
          : getSavedPosition(todo.metadata, metadataKey);
        const initialPosition =
          savedPosition && isInsideShape(savedPosition.x, savedPosition.y)
            ? savedPosition
            : randomPointInShape();
        return makeSeed(todo.id, todo.text, color, initialPosition);
      });
    });
  }, [todos, categories, isGuest, isInsideShape, randomPointInShape, metadataKey]);

  useEffect(() => {
    if (isGuest) return;
    for (const todo of todos) {
      if (initializedSeedIdsRef.current.has(todo.id)) continue;
      const saved = getSavedPosition(todo.metadata, metadataKey);
      if (saved) {
        initializedSeedIdsRef.current.add(todo.id);
        continue;
      }
      const seed = seeds.find((item) => item.id === todo.id);
      if (!seed) continue;
      initializedSeedIdsRef.current.add(todo.id);
      const currentMetadata = (todo.metadata ?? {}) as TodoMetadata;
      updateMutation.mutate({
        id: seed.id,
        metadata: {
          ...currentMetadata,
          voronoi: {
            ...(currentMetadata.voronoi ?? {}),
            [metadataKey]: {
              x: Math.round(seed.x),
              y: Math.round(seed.y),
            },
          },
        },
      });
    }
  }, [isGuest, todos, seeds, updateMutation, metadataKey]);

  const { voronoi, colors } = useMemo(() => {
    const pts: [number, number][] = seeds.map((s) => [s.x, s.y]);
    const d = Delaunay.from(pts);
    const v = d.voronoi([0, 0, WIDTH, HEIGHT]);
    const c = seeds.map((s) => s.color);
    return { voronoi: v, colors: c };
  }, [seeds]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    if (shapePath) {
      ctx.save();
      ctx.clip(shapePath);
    }

    for (let i = 0; i < seeds.length; i++) {
      ctx.beginPath();
      voronoi.renderCell(i, ctx);
      ctx.fillStyle = colors[i];
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    if (shapePath) {
      ctx.restore();
      ctx.beginPath();
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 2;
      ctx.stroke(shapePath);
    }

    for (const s of seeds) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, SEED_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = '#111827';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#111827';
      ctx.font = '12px sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.text, s.x + 12, s.y, 180);
    }
  }, [seeds, voronoi, colors, shapePath]);

  const pointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * WIDTH,
      y: ((e.clientY - rect.top) / rect.height) * HEIGHT,
    };
  };

  const hitSeed = (x: number, y: number) => {
    const r2 = (SEED_RADIUS + 4) ** 2;
    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i];
      if ((s.x - x) ** 2 + (s.y - y) ** 2 <= r2) return i;
    }
    return null;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = pointerPos(e);
    if (!isInsideShape(x, y)) return;
    const i = hitSeed(x, y);
    if (i !== null) {
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragIndex(i);
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragIndex === null) return;
    const { x, y } = pointerPos(e);
    const nextX = Math.max(0, Math.min(WIDTH, x));
    const nextY = Math.max(0, Math.min(HEIGHT, y));
    if (!isInsideShape(nextX, nextY)) return;
    setSeeds((prev) =>
      prev.map((s, i) => (i === dragIndex ? { ...s, x: nextX, y: nextY } : s)),
    );
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragIndex !== null) e.currentTarget.releasePointerCapture(e.pointerId);
    if (dragIndex !== null && !isGuest) {
      const seed = seeds[dragIndex];
      const todo = todos.find((item) => item.id === seed?.id);
      if (seed && todo) {
        const saved = getSavedPosition(todo.metadata, metadataKey);
        const x = Math.round(seed.x);
        const y = Math.round(seed.y);
        if (!saved || saved.x !== x || saved.y !== y) {
          const currentMetadata = (todo.metadata ?? {}) as TodoMetadata;
          updateMutation.mutate({
            id: seed.id,
            metadata: {
              ...currentMetadata,
              voronoi: {
                ...(currentMetadata.voronoi ?? {}),
                [metadataKey]: { x, y },
              },
            },
          });
        }
      }
    }
    setDragIndex(null);
  };

  return (
    <>
      <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-10">
        <div className={cn(contentClassName)}>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {todosLoading ? (
          <PageLoader />
        ) : todos.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground text-sm">
            No todos yet. Add todos to generate seeds.
          </p>
        ) : (
          <canvas
            ref={canvasRef}
            width={WIDTH}
            height={HEIGHT}
            className={cn(
              'w-full touch-none cursor-grab rounded-md bg-background active:cursor-grabbing',
              showCanvasBorder && 'border',
            )}
            style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
        )}
        {afterCanvas}
      </div>

      <AddTaskDrawer
        categories={categories}
        onSubmit={(data) => createMutation.mutate(data)}
        isPending={createMutation.isPending}
        onAddCategory={() => setAddCategoryOpen(true)}
      />
      <AddCategory open={addCategoryOpen} onOpenChange={setAddCategoryOpen} />
    </>
  );
}
