import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  formatProgressPercent,
  RING_HOVER_STROKE_BOOST,
  type RingGeometry,
  type RingSegmentData,
  type RingSegmentStyle,
  type RingSummary,
  shouldClearRingHighlight,
} from '@/utils/ring-geometry';

type RingSegmentProps = {
  seg: RingSegmentData;
  geometry: RingGeometry;
  segmentStyle: RingSegmentStyle;
  replayKey: number;
  trackHidden: boolean;
  isHighlighted: boolean;
  onHighlight: (id: number) => void;
  onHighlightLeave: (event: React.MouseEvent) => void;
  onActivate: (id: number) => void;
};

function RingSegment({
  seg,
  geometry,
  segmentStyle,
  replayKey,
  trackHidden,
  isHighlighted,
  onHighlight,
  onHighlightLeave,
  onActivate,
}: RingSegmentProps) {
  const { radius, strokeWidth, hitStrokeWidth, circumference, center } = geometry;
  const [progressLength, setProgressLength] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const previousReplayKey = useRef(replayKey);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const replayTriggered = previousReplayKey.current !== replayKey;
    previousReplayKey.current = replayKey;

    if (reducedMotion) {
      setIsResetting(true);
      setProgressLength(seg.progressLength);
      return;
    }

    if (replayTriggered) {
      setIsResetting(true);
      setProgressLength(0);
    }

    const frame = requestAnimationFrame(() => {
      if (replayTriggered) setIsResetting(false);
      setProgressLength(seg.progressLength);
    });

    return () => cancelAnimationFrame(frame);
  }, [replayKey, seg.progressLength]);

  return (
    <g
      className={cn('ring-segment transition-[opacity,filter] duration-150', isHighlighted && 'ring-segment--hovered')}
    >
      {/* Base arc: full effort, lighter */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill='none'
        stroke={trackHidden ? 'transparent' : seg.color}
        strokeOpacity={isHighlighted ? 0.45 : 0.2}
        strokeWidth={strokeWidth}
        strokeLinecap={segmentStyle.strokeLinecap}
        strokeDasharray={`${seg.dashLength} ${circumference}`}
        strokeDashoffset={seg.dashOffset}
        className='pointer-events-none'
      />
      {/* Progress arc: animated fill, stronger */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill='none'
        stroke={seg.color}
        strokeWidth={isHighlighted ? strokeWidth + RING_HOVER_STROKE_BOOST : strokeWidth}
        strokeLinecap={segmentStyle.strokeLinecap}
        strokeDashoffset={seg.dashOffset}
        className='ring-progress-arc pointer-events-none'
        style={
          {
            color: seg.color,
            strokeDasharray: `${progressLength} ${circumference}`,
            transition: isResetting ? 'none' : 'stroke-dasharray 450ms ease-out',
          } as React.CSSProperties
        }
      />
      {/* Invisible wider stroke for easier hover targeting */}
      {/* biome-ignore lint/a11y/useSemanticElements: SVG <circle> cannot be an HTML <button>; role="button" is the ARIA-correct pattern for interactive SVG */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill='none'
        stroke='transparent'
        strokeWidth={hitStrokeWidth}
        strokeLinecap={segmentStyle.strokeLinecap}
        strokeDasharray={`${seg.dashLength} ${circumference}`}
        strokeDashoffset={seg.dashOffset}
        className='cursor-pointer touch-manipulation'
        pointerEvents='stroke'
        role='button'
        tabIndex={0}
        data-ring-segment-hit={seg.id}
        onMouseEnter={() => onHighlight(seg.id)}
        onMouseLeave={onHighlightLeave}
        onClick={() => onActivate(seg.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onActivate(seg.id);
          }
        }}
        aria-label={`${seg.text}, ${seg.progress} of ${seg.effort} complete`}
      />
    </g>
  );
}

type RingCenterLabelProps = {
  displaySegment: RingSegmentData | null;
  animatedRatio: number;
  ringSummary: Pick<RingSummary, 'totalProgress' | 'todoCount'>;
  totalEffort: number;
  isMobile: boolean;
  isActiveSegment: boolean;
};

function RingCenterLabel({
  displaySegment,
  animatedRatio,
  ringSummary,
  totalEffort,
  isMobile,
  isActiveSegment,
}: RingCenterLabelProps) {
  if (displaySegment) {
    return (
      <div className='max-w-[min(100%,14rem)] text-center'>
        <p className='truncate text-sm font-semibold text-foreground'>{displaySegment.text}</p>
        <p className='mt-0.5 text-xs text-muted-foreground'>{displaySegment.categoryName}</p>
        <p className='mt-1.5 text-3xl font-bold tabular-nums tracking-tight text-foreground sm:text-4xl'>
          {formatProgressPercent(animatedRatio)}
        </p>
        <p className='text-xs text-muted-foreground'>
          {displaySegment.progress} / {displaySegment.effort} effort
        </p>
        {isMobile && isActiveSegment && <p className='mt-1.5 text-[10px] text-muted-foreground'>Tap again to edit</p>}
      </div>
    );
  }

  return (
    <div className='max-w-[min(100%,14rem)] text-center'>
      <p className='text-sm font-medium text-muted-foreground'>Overall</p>
      <p className='mt-0.5 text-3xl font-bold tabular-nums tracking-tight text-foreground sm:text-4xl'>
        {formatProgressPercent(animatedRatio)}
      </p>
      <p className='mt-1.5 text-xs text-muted-foreground'>
        {ringSummary.totalProgress} / {totalEffort} effort
      </p>
      <p className='text-xs text-muted-foreground'>
        {ringSummary.todoCount} {ringSummary.todoCount === 1 ? 'todo' : 'todos'} in progress
      </p>
    </div>
  );
}

type RingLegendProps = {
  segments: RingSegmentData[];
  isMobile: boolean;
  activeId: number | null;
  isHighlighted: (id: number) => boolean;
  onHighlight: (id: number) => void;
  onClearHighlight: () => void;
  onHighlightLeave: (event: React.MouseEvent) => void;
  onActivate: (id: number) => void;
};

function RingLegend({
  segments,
  isMobile,
  activeId,
  isHighlighted,
  onHighlight,
  onClearHighlight,
  onHighlightLeave,
  onActivate,
}: RingLegendProps) {
  return (
    <div className='flex w-full flex-wrap justify-center gap-x-2 gap-y-2 px-1'>
      {segments.map((seg) => {
        const highlighted = isHighlighted(seg.id);
        return (
          <button
            key={seg.id}
            type='button'
            data-ring-legend-item={seg.id}
            className={cn(
              'flex items-center gap-1.5 rounded-md text-sm transition-colors touch-manipulation',
              isMobile ? 'min-h-11 px-3 py-2' : 'px-2 py-1',
              highlighted ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/60',
            )}
            onMouseEnter={() => onHighlight(seg.id)}
            onMouseLeave={onHighlightLeave}
            onFocus={() => onHighlight(seg.id)}
            onBlur={onClearHighlight}
            onClick={() => {
              if (isMobile) onActivate(seg.id);
            }}
            aria-pressed={activeId === seg.id}
          >
            <span
              className={cn(
                'inline-block h-3 w-3 shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-background transition-transform',
                highlighted ? 'scale-110 ring-current' : 'ring-transparent',
              )}
              style={{ backgroundColor: seg.color, color: seg.color }}
            />
            <span className='max-w-[12rem] truncate'>{seg.text}</span>
            <span className='tabular-nums text-xs opacity-70'>
              {seg.progress}/{seg.effort}
            </span>
          </button>
        );
      })}
    </div>
  );
}

type RingChartProps = {
  segments: RingSegmentData[];
  geometry: RingGeometry;
  segmentStyle: RingSegmentStyle;
  replayKey: number;
  trackHidden: boolean;
  hoveredId: number | null;
  activeId: number | null;
  displaySegment: RingSegmentData | null;
  animatedRatio: number;
  ringSummary: RingSummary;
  totalEffort: number;
  isMobile: boolean;
  onHighlight: (id: number) => void;
  onClearHighlight: () => void;
  onActivate: (id: number) => void;
  onDeselect: () => void;
};

export function RingChart({
  segments,
  geometry,
  segmentStyle,
  replayKey,
  trackHidden,
  hoveredId,
  activeId,
  displaySegment,
  animatedRatio,
  ringSummary,
  totalEffort,
  isMobile,
  onHighlight,
  onClearHighlight,
  onActivate,
  onDeselect,
}: RingChartProps) {
  const isSegmentHighlighted = (id: number) => hoveredId === id || activeId === id;
  const handleHoverLeave = (event: React.MouseEvent) => {
    if (shouldClearRingHighlight(event)) onClearHighlight();
  };

  return (
    <div className='flex w-full flex-col items-center gap-6'>
      <div className='relative aspect-square w-full max-w-xl'>
        <svg
          viewBox={`0 0 ${geometry.viewBoxSize} ${geometry.viewBoxSize}`}
          className='size-full -rotate-90'
          role='img'
          aria-label={`Ring chart: ${segments.length} active todo${segments.length === 1 ? '' : 's'}, ${totalEffort} total effort`}
        >
          {/* biome-ignore lint/a11y/useSemanticElements: SVG <rect> cannot be an HTML <button>; role="button" is the ARIA-correct pattern for interactive SVG */}
          <rect
            x={0}
            y={0}
            width={geometry.viewBoxSize}
            height={geometry.viewBoxSize}
            fill='transparent'
            role='button'
            tabIndex={0}
            aria-label='Deselect segment'
            onMouseEnter={onClearHighlight}
            onClick={onDeselect}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
                e.preventDefault();
                onDeselect();
              }
            }}
          />
          {segments.map((seg) => (
            <RingSegment
              key={seg.id}
              seg={seg}
              geometry={geometry}
              segmentStyle={segmentStyle}
              replayKey={replayKey}
              trackHidden={trackHidden}
              isHighlighted={isSegmentHighlighted(seg.id)}
              onHighlight={onHighlight}
              onHighlightLeave={handleHoverLeave}
              onActivate={onActivate}
            />
          ))}
        </svg>

        <div className='pointer-events-none absolute inset-0 flex items-center justify-center px-4 sm:px-6'>
          <RingCenterLabel
            displaySegment={displaySegment}
            animatedRatio={animatedRatio}
            ringSummary={ringSummary}
            totalEffort={totalEffort}
            isMobile={isMobile}
            isActiveSegment={activeId === displaySegment?.id}
          />
        </div>
      </div>

      <RingLegend
        segments={segments}
        isMobile={isMobile}
        activeId={activeId}
        isHighlighted={isSegmentHighlighted}
        onHighlight={onHighlight}
        onClearHighlight={onClearHighlight}
        onHighlightLeave={handleHoverLeave}
        onActivate={onActivate}
      />
    </div>
  );
}
