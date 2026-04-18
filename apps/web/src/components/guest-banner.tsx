import { Link } from '@tanstack/react-router';

export function GuestBanner({ className }: { className?: string }) {
  return (
    <div
      className={
        'rounded-md border border-dashed p-3 text-center text-muted-foreground text-sm' +
        (className ?? '')
      }
    >
      This is a demo with sample data.{' '}
      <Link
        to="/auth/$path"
        params={{ path: 'sign-in' }}
        className="font-medium underline underline-offset-4 hover:text-primary"
      >
        Sign in
      </Link>{' '}
      to save your work.
    </div>
  );
}
