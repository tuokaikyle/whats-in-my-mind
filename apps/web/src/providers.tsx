import { AuthUIProvider } from "@daveyplate/better-auth-ui"
import { authClient } from "@/lib/auth-client"
import { Link, useRouter } from "@tanstack/react-router"

export function Providers({ children }: { children: React.ReactNode }) {
    const router = useRouter()

  return (
      <AuthUIProvider
        authClient={authClient}
        navigate={(href) => router.navigate({ href })}
        replace={(href) => router.navigate({ href, replace: true })}
        Link={({ href, ...props }) => <Link to={href} {...props} />}
      >
          {children}
      </AuthUIProvider>
    )
}