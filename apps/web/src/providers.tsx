import { AuthUIProvider } from '@daveyplate/better-auth-ui';
import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { queryClient } from './utils/trpc';

function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  useEffect(() => {
    queryClient.clear();
  }, [session?.user.id]);

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
