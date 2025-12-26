import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/cristo/$path')({
  component: RouteComponent,
});

function RouteComponent() {
  const { path } = Route.useParams();
  console.log(path);
  return (
    <main className='container mx-auto my-auto flex flex-col items-center p-4 md:p-6'>
      {path}
    </main>
  );
}
