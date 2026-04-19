import { createFileRoute } from '@tanstack/react-router'
import { ShapeVoronoiPage } from './shape-voronoi-page'
import headsimpleSvgRaw from '@/utils/head-simple.svg?raw'

export const Route = createFileRoute('/voronoi/head-simple')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <ShapeVoronoiPage
      svgRaw={headsimpleSvgRaw}
      metadataKey="headSimple"
      title="Voronoi playground (Cloud)"
      description="Drag a seed inside the cloud silhouette. Each seed represents one todo."
    />
  )
}
