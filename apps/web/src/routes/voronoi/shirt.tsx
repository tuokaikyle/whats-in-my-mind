import { createFileRoute } from '@tanstack/react-router';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { ShapeVoronoiPage } from './-shape-voronoi-page';
import circleSvgRaw from '@/utils/circle.svg?raw';

const clothSvgModules = import.meta.glob('@/utils/cloth-svg/*.svg', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const clothItems = Object.entries(clothSvgModules)
  .map(([path, src]) => ({
    src,
    name: (path.split('/').pop() ?? path).replace(/\.svg$/, ''),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const Route = createFileRoute('/voronoi/shirt')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ShapeVoronoiPage
      svgRaw={circleSvgRaw}
      metadataKey='shirt'
      title='Voronoi playground (Shirt)'
      description='Drag a seed inside the circle. Each seed represents one todo.'
      showCanvasBorder={false}
      contentClassName='mb-0'
      afterCanvas={
        <div className='-mt-4 pb-1'>
          <Carousel
            opts={{
              align: 'start',
              loop: clothItems.length > 1,
            }}
            className='mx-auto w-full max-w-[12rem] sm:max-w-xs'
          >
            <CarouselContent>
              {clothItems.map((item) => (
                <CarouselItem key={item.name} className='basis-full'>
                  <div className='flex h-full flex-col items-center p-3'>
                    <img
                      src={item.src}
                      alt={item.name}
                      className='h-50 w-full object-contain'
                    />
                    <p className='mt-2 text-center text-muted-foreground text-sm'>
                      {item.name}
                    </p>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      }
    />
  );
}
