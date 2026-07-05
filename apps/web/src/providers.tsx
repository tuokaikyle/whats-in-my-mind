import { AuthUIProvider } from '@daveyplate/better-auth-ui';
import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { authClient } from '@/lib/auth-client';
import { queryClient } from './utils/trpc';

function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const previousUserIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (previousUserIdRef.current === userId) return;
    previousUserIdRef.current = userId;
    queryClient.clear();
  }, [userId]);

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
