import { cn } from '@/lib/utils';

export function EmptyState({
  title,
  description,
  size = 'lg',
  className,
}: {
  title: string;
  description?: string;
  /** 'lg' for full-page views, 'sm' inside cards. */
  size?: 'sm' | 'lg';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed text-center',
        size === 'lg' ? 'py-16' : 'py-8',
        className,
      )}
    >
      <p className='font-medium text-foreground'>{title}</p>
      {description ? <p className='mt-1 text-sm text-muted-foreground'>{description}</p> : null}
    </div>
  );
}
