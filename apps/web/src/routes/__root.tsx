import type { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRootRouteWithContext, HeadContent } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import type { trpc } from '@/utils/trpc';
import '../index.css';
import Layout from '@/components/layout';

export interface RouterAppContext {
  trpc: typeof trpc;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "My mind",
      },
      {
        name: 'description',
        content: 'One set of tasks, many ways to see them.',
      },
    ],
  }),
});

function RootComponent() {
  return (
    <>
      <HeadContent />
      <ThemeProvider attribute='class' defaultTheme='dark' disableTransitionOnChange storageKey='vite-ui-theme'>
        <div className='grid h-svh grid-rows-[auto_1fr]'>
          <Layout />
        </div>
        <Toaster richColors />
      </ThemeProvider>
      {import.meta.env.DEV && (
        <>
          <TanStackRouterDevtools position='bottom-right' />
          <ReactQueryDevtools position='bottom' buttonPosition='bottom-right' />
        </>
      )}
    </>
  );
}
