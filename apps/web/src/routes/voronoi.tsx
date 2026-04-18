import { createFileRoute } from '@tanstack/react-router';
import { Delaunay } from 'd3-delaunay';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/voronoi')({
  component: VoronoiPage,
});

type Seed = { id: number; x: number; y: number };

const WIDTH = 800;
const HEIGHT = 500;
const SEED_RADIUS = 6;
const MAX_PIECES = 10;

const randomSeed = (id: number): Seed => ({
  id,
  x: 40 + Math.random() * (WIDTH - 80),
  y: 40 + Math.random() * (HEIGHT - 80),
});

function VoronoiPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [seeds, setSeeds] = useState<Seed[]>(() =>
    Array.from({ length: 10 }, (_, i) => randomSeed(i + 1)),
  );
  const nextId = useRef(seeds.length + 1);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const { voronoi, colors } = useMemo(() => {
    const pts: [number, number][] = seeds.map((s) => [s.x, s.y]);
    const d = Delaunay.from(pts);
    const v = d.voronoi([0, 0, WIDTH, HEIGHT]);
    const step = 360 / Math.max(seeds.length, 1);
    const c = seeds.map((_, i) => `hsl(${Math.round(i * step)} 60% 75%)`);
    return { voronoi: v, colors: c };
  }, [seeds]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    for (let i = 0; i < seeds.length; i++) {
      ctx.beginPath();
      voronoi.renderCell(i, ctx);
      ctx.fillStyle = colors[i];
      ctx.fill();
    }

    for (const s of seeds) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, SEED_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = '#111827';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [seeds, voronoi, colors]);

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
    const i = hitSeed(x, y);
    if (i !== null) {
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragIndex(i);
    }
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragIndex === null) return;
    const { x, y } = pointerPos(e);
    setSeeds((prev) =>
      prev.map((s, i) =>
        i === dragIndex
          ? {
              ...s,
              x: Math.max(0, Math.min(WIDTH, x)),
              y: Math.max(0, Math.min(HEIGHT, y)),
            }
          : s,
      ),
    );
  };
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragIndex !== null) e.currentTarget.releasePointerCapture(e.pointerId);
    setDragIndex(null);
  };

  const addSeed = () => {
    if (seeds.length >= MAX_PIECES) return;
    setSeeds((prev) => [...prev, randomSeed(nextId.current++)]);
  };
  const removeSeed = () => setSeeds((prev) => prev.slice(0, -1));

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Voronoi playground</h1>
        <p className="text-sm text-muted-foreground">
          Drag a seed to move its cell. Add or remove pieces with the buttons.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={addSeed} disabled={seeds.length >= MAX_PIECES}>
          Add piece
        </Button>
        <Button
          variant="outline"
          onClick={removeSeed}
          disabled={seeds.length === 0}
        >
          Remove piece
        </Button>
        <span className="text-sm text-muted-foreground">
          {seeds.length}/{MAX_PIECES} pieces
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        className="w-full touch-none cursor-grab rounded-md border bg-background active:cursor-grabbing"
        style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
    </div>
  );
}
