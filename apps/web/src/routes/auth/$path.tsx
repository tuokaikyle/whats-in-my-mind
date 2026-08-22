import { AuthView } from '@daveyplate/better-auth-ui';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/auth/$path')({
  component: RouteComponent,
});

function RouteComponent() {
  const { path } = Route.useParams();

  return (
    <main className='container mx-auto flex min-h-full flex-col items-center justify-start md:justify-center p-4 md:p-6 [&_button]:cursor-pointer [&_a]:cursor-pointer'>
      <AuthView path={path} socialLayout={'horizontal'} />
    </main>
  );
}
