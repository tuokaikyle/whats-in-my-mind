import { AuthUIProvider } from '@daveyplate/better-auth-ui';
import { authClient } from '@/lib/auth-client';
import { Link, useNavigate } from '@tanstack/react-router';

function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

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
