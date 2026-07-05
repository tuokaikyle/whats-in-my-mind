import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { trpc } from '@/utils/trpc';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const Route = createFileRoute('/manage')({
  component: ManagePage,
});

function ManagePage() {
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());

  return (
    <div className="mx-auto w-full max-w-md py-10">
      <Card>
        <CardHeader>
          <CardTitle>Manage</CardTitle>
          <CardDescription>Application settings and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="mb-2 font-medium">API Status</h2>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  healthCheck.data ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-muted-foreground text-sm">
                {healthCheck.isLoading
                  ? 'Checking...'
                  : healthCheck.data
                    ? 'Connected'
                    : 'Disconnected'}
              </span>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
