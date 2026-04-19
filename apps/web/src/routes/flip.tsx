import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';

type HeatmapValue = {
  date: string;
  count: number;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const TOTAL_DAYS = 365;

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

const scoreFromDate = (date: Date) => {
  const seed = Number(formatDate(date).replaceAll('-', ''));
  const noise = Math.abs(Math.sin(seed * 17.123) * 10000) % 1;
  if (noise < 0.55) return 0;
  if (noise < 0.75) return 1;
  if (noise < 0.88) return 2;
  if (noise < 0.96) return 3;
  return 4;
};

const buildHeatmapData = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(today.getTime() - TOTAL_DAYS * DAY_IN_MS);
  const values: HeatmapValue[] = [];

  for (let i = 0; i <= TOTAL_DAYS; i++) {
    const date = new Date(startDate.getTime() + i * DAY_IN_MS);
    const level = scoreFromDate(date);
    values.push({
      date: formatDate(date),
      count: level === 0 ? 0 : level * 2,
    });
  }

  return { startDate, endDate: today, values };
};

const heatmapData = buildHeatmapData();

export const Route = createFileRoute('/flip')({
  component: FlipPage,
});

function FlipPage() {
  const [flippedTiles, setFlippedTiles] = useState<boolean[]>(
    Array.from({ length: 9 }, () => false),
  );

  const toggleTile = (index: number) => {
    setFlippedTiles((prev) =>
      prev.map((isFlipped, i) => (i === index ? !isFlipped : isFlipped)),
    );
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Contribution Heatmap</h1>
        <p className="text-sm text-muted-foreground">
          GitHub-style activity view for the last 12 months.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <CalendarHeatmap
          startDate={heatmapData.startDate}
          endDate={heatmapData.endDate}
          values={heatmapData.values}
          gutterSize={3}
          showWeekdayLabels
          classForValue={(value) => {
            const count = typeof value?.count === 'number' ? value.count : 0;
            if (count === 0) return 'github-empty';
            if (count <= 2) return 'github-scale-1';
            if (count <= 4) return 'github-scale-2';
            if (count <= 6) return 'github-scale-3';
            return 'github-scale-4';
          }}
          titleForValue={(value) => {
            if (!value) return 'No activity';
            const count = typeof value.count === 'number' ? value.count : 0;
            const date = String(value.date);
            if (count === 0) return `${date}: no activity`;
            return `${date}: ${count} contributions`;
          }}
        />

        <div className="mt-3 flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          <span className="inline-block h-3 w-3 rounded-[2px] bg-[#ebedf0] dark:bg-[#161b22]" />
          <span className="inline-block h-3 w-3 rounded-[2px] bg-[#9be9a8] dark:bg-[#0e4429]" />
          <span className="inline-block h-3 w-3 rounded-[2px] bg-[#40c463] dark:bg-[#006d32]" />
          <span className="inline-block h-3 w-3 rounded-[2px] bg-[#30a14e] dark:bg-[#26a641]" />
          <span className="inline-block h-3 w-3 rounded-[2px] bg-[#216e39] dark:bg-[#39d353]" />
          <span>More</span>
        </div>

        <div className="mt-4 w-[50%] mx-auto">
          <p className="mb-2 text-sm font-medium">3 x 3 Grid</p>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 9 }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleTile(i)}
                className="tile-flip-wrap aspect-square w-full"
                aria-pressed={flippedTiles[i]}
                aria-label={`Tile ${i + 1}, ${flippedTiles[i] ? 'back' : 'front'} side`}
              >
                <span className={`tile-flip-inner ${flippedTiles[i] ? 'is-flipped' : ''}`}>
                  <span className="tile-face tile-front">{i + 1}</span>
                  <span className="tile-face tile-back">{i + 1}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .react-calendar-heatmap .color-empty {
          fill: transparent;
        }

        .react-calendar-heatmap .github-empty {
          fill: #ebedf0;
        }

        .dark .react-calendar-heatmap .github-empty {
          fill: #161b22;
        }

        .react-calendar-heatmap .github-scale-1 {
          fill: #9be9a8;
        }

        .dark .react-calendar-heatmap .github-scale-1 {
          fill: #0e4429;
        }

        .react-calendar-heatmap .github-scale-2 {
          fill: #40c463;
        }

        .dark .react-calendar-heatmap .github-scale-2 {
          fill: #006d32;
        }

        .react-calendar-heatmap .github-scale-3 {
          fill: #30a14e;
        }

        .dark .react-calendar-heatmap .github-scale-3 {
          fill: #26a641;
        }

        .react-calendar-heatmap .github-scale-4 {
          fill: #216e39;
        }

        .dark .react-calendar-heatmap .github-scale-4 {
          fill: #39d353;
        }

        .react-calendar-heatmap text {
          fill: hsl(var(--muted-foreground));
          font-size: 10px;
        }

        .dark .react-calendar-heatmap text {
          fill: #c9d1d9;
        }

        .react-calendar-heatmap rect {
          rx: 2;
          ry: 2;
        }

        .tile-flip-wrap {
          perspective: 900px;
          border: none;
          padding: 0;
          background: transparent;
          cursor: pointer;
        }

        .tile-flip-inner {
          position: relative;
          display: block;
          height: 100%;
          width: 100%;
          transform-style: preserve-3d;
          transition: transform 360ms ease;
        }

        .tile-flip-inner.is-flipped {
          transform: rotateX(180deg);
        }

        .tile-face {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.375rem;
          border: 1px solid;
          font-size: 0.875rem;
          font-weight: 600;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
        }

        .tile-front {
          border-color: rgb(147 197 253);
          background: rgb(59 130 246 / 0.8);
          color: rgb(239 246 255);
        }

        .tile-back {
          transform: rotateY(180deg);
          border-color: rgb(134 239 172);
          background: rgb(34 197 94 / 0.85);
          color: rgb(240 253 244);
        }
      `}</style>
    </div>
  );
}
