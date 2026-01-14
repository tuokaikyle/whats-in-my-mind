import { Link } from '@tanstack/react-router';
import {
  Home,
  LayoutDashboard,
  ListTodo,
  Settings,
  ChevronUp,
  User2,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ModeToggle } from './mode-toggle';
import { authClient } from '@/lib/auth-client';
import { useNavigate } from '@tanstack/react-router';
import { queryClient } from '@/utils/trpc';

const menuItems = [
  {
    title: 'Home',
    url: '/',
    icon: Home,
  },
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Todos',
    url: '/todos',
    icon: ListTodo,
  },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>whats-in-my-mind</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton render={<Link to={item.url} />}>
                    <item.icon />
                    <span>{item.title}</span>
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
            <div className="flex items-center justify-between px-2">
              {open && <span className="text-sm">Theme</span>}
              <ModeToggle />
            </div>
          </SidebarMenuItem>
          {session && (
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger render={<SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground" />}>
                  <User2 />
                  <span>{session.user.name}</span>
                  <ChevronUp className="ml-auto" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  className="w-[--radix-popper-anchor-width]"
                >
                  <DropdownMenuItem
                    onClick={() => {
                      authClient.signOut({
                        fetchOptions: {
                          onSuccess: () => {
                            queryClient.clear();
                            navigate({ to: '/' });
                          },
                        },
                      });
                    }}
                  >
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
