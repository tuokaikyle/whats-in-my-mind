import { createFileRoute } from '@tanstack/react-router';
import brainSvgRaw from '@/utils/brain-9-outline.svg?raw';
import { ShapeVoronoiPage } from './-shape-voronoi-page';

export const Route = createFileRoute('/voronoi/brain')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ShapeVoronoiPage
      svgRaw={brainSvgRaw}
      metadataKey='brain'
      title='Voronoi playground (Brain)'
      description='Drag a seed inside the brain silhouette. Each seed represents one todo.'
    />
  );
}
