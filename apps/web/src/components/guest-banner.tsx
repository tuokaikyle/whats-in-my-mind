import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';

export function GuestBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn('mb-4 rounded-md border border-dashed p-3 text-center text-muted-foreground text-sm', className)}
    >
      This is a demo with sample data.{' '}
      <Link
        to='/auth/$path'
        params={{ path: 'sign-in' }}
        className='font-medium underline underline-offset-4 hover:text-primary'
      >
        Sign in
      </Link>{' '}
      to save your work.
    </div>
  );
}
