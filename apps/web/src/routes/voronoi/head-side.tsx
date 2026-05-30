import { createFileRoute } from '@tanstack/react-router';
import headSideSvgRaw from '@/utils/head-side-view-black-silhouette-of-male.svg?raw';
import { ShapeVoronoiPage } from './-shape-voronoi-page';

export const Route = createFileRoute('/voronoi/head-side')({
  component: HeadSideVoronoiPage,
});

function HeadSideVoronoiPage() {
  return (
    <ShapeVoronoiPage
      svgRaw={headSideSvgRaw}
      metadataKey='headSide'
      title='Voronoi playground (Head side)'
      description='Drag a seed inside the silhouette. Each seed represents one todo.'
    />
  );
}
