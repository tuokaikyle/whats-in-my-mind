import { AuthUIProvider } from '@daveyplate/better-auth-ui';
import { Link, useNavigate } from '@tanstack/react-router';
import { useLayoutEffect, useRef } from 'react';
import { authClient } from '@/lib/auth-client';
import { queryClient } from './utils/trpc';

function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  const hasResolvedSessionRef = useRef(false);
  const previousUserIdRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (isPending) return;

    const userId = session?.user?.id ?? null;

    if (!hasResolvedSessionRef.current) {
      hasResolvedSessionRef.current = true;
      previousUserIdRef.current = userId;
      return;
    }

    if (previousUserIdRef.current !== userId) {
      previousUserIdRef.current = userId;
      queryClient.clear();
    }
  }, [isPending, session?.user?.id]);

  return (
    <AuthUIProvider
      authClient={authClient}
      navigate={(href) => navigate({ to: href })}
      replace={(href) => navigate({ to: href, replace: true })}
      Link={({ href, ...props }) => <Link to={href} {...props} />}
      social={{ providers: ['google', 'facebook'] }}
    >
      {children}
    </AuthUIProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProviderInner>{children}</AuthProviderInner>;
}
