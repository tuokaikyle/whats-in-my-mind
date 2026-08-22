import { cn } from '@/lib/utils';

export function EmptyState({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center',
        className,
      )}
    >
      <p className='font-medium text-foreground'>{title}</p>
      {description ? <p className='mt-1 text-sm text-muted-foreground'>{description}</p> : null}
    </div>
  );
}
