import { createFileRoute } from '@tanstack/react-router';
import { ShapeVoronoiPage } from './-shape-voronoi-page';

export const Route = createFileRoute('/voronoi/rectangular')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ShapeVoronoiPage
      svgRaw=''
      metadataKey='rectangular'
      title='Voronoi playground'
      description='Drag a seed to move its cell. Each seed represents one todo.'
    />
  );
}
