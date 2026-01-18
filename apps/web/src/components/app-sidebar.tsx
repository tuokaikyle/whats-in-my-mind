import { UserButton } from '@daveyplate/better-auth-ui';
import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { Command, Home, ListTodo } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { queryClient } from '@/utils/trpc';
import { authClient } from '@/lib/auth-client';

const menuItems = [
  {
    title: 'Home',
    url: '/',
    icon: Home,
  },
  {
    title: 'Todos',
    url: '/todos',
    icon: ListTodo,
  },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const prevSession = useRef(session);

  // When the session transitions from a user -> null, clear cached data to avoid showing prior user info
  useEffect(() => {
    if (prevSession.current && !session) {
      queryClient.clear();
      navigate({ to: '/' });
    }
    prevSession.current = session;
  }, [navigate, session]);

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<a href="#" />}
              className="rounded-md"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Command className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-medium">Documentation</span>
                <span className="">v1.0.0</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    className="rounded-md"
                    render={<Link to={item.url} />}
                  >
                    <item.icon />
                    {item.title}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserButton
              size="default"
              side="right"
              sideOffset={16}
              className="w-full bg-primary-foreground text-primary hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
