import { createFileRoute } from '@tanstack/react-router';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const Route = createFileRoute('/treemap')({
  component: TreemapPage,
});

function TreemapPage() {
  return (
    <div className="mx-auto w-full max-w-md py-10">
      <Card>
        <CardHeader>
          <CardTitle>Tree Map</CardTitle>
          <CardDescription>Coming soon</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="py-4 text-center text-muted-foreground">
            This view is under construction.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
