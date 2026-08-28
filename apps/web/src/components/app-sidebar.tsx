import { UserButton } from '@daveyplate/better-auth-ui';
import { Link, useMatchRoute } from '@tanstack/react-router';
import {
  Bubbles,
  CircleDashed,
  Command,
  FileCheck,
  Gauge,
  Grid2X2,
  Info,
  LayoutGrid,
  PanelLeft,
  Settings2,
  TrendingUp,
} from 'lucide-react';
import type * as React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { ModeToggle } from './mode-toggle';

export const sidebarData: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  navMain: {
    title: string;
    url: string;
    icon: React.ElementType;
    group: string;
  }[];
} = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  navMain: [
    {
      title: 'Simple',
      url: '/simple',
      icon: FileCheck,
      group: 'Views',
    },
    {
      title: 'Progress',
      url: '/progress',
      icon: TrendingUp,
      group: 'Views',
    },
    {
      title: 'Bubble',
      url: '/bubble',
      icon: Bubbles,
      group: 'Views',
    },
    // {
    //   title: 'Gauge',
    //   url: '/gauge',
    //   icon: Gauge,
    //   group: 'Views',
    // },
    {
      title: 'Tree Map',
      url: '/treemap',
      icon: LayoutGrid,
      group: 'Views',
    },
    {
      title: 'Ring',
      url: '/ring',
      icon: CircleDashed,
      group: 'Views',
    },
    {
      title: 'Matrix',
      url: '/matrix',
      icon: Grid2X2,
      group: 'Views',
    },
    {
      title: 'Kpi Gauge',
      url: '/kpigauge',
      icon: Gauge,
      group: 'Views',
    },
    // General group
    {
      title: 'Manage',
      url: '/manage',
      icon: Settings2,
      group: 'General',
    },
    {
      title: 'About',
      url: '/about',
      icon: Info,
      group: 'General',
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const matchRoute = useMatchRoute();
  const { toggleSidebar, open } = useSidebar();
  const isMobile = useIsMobile();

  // Group items by their 'group' property
  const groupedNavMain = sidebarData.navMain.reduce((acc, item) => {
    const group = item.group || 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, typeof sidebarData.navMain>);

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader className='border-b'>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' onClick={toggleSidebar} asChild>
              <div className='group'>
                <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
                  <Command className='size-4' />
                </div>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium'>
                    What's in my mind
                  </span>
                  <span className='truncate text-xs'>
                    Present ideas differently
                  </span>
                </div>
                <PanelLeft className='size-4' />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {Object.entries(groupedNavMain).map(([group, items]) => (
          <SidebarGroup key={group}>
            <SidebarGroupLabel>{group}</SidebarGroupLabel>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={!!matchRoute({ to: item.url })}
                  >
                    <Link
                      to={item.url}
                      onClick={() => {
                        if (isMobile) toggleSidebar();
                      }}
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className='mb-1'>
        <UserButton
          additionalLinks={[<ModeToggle key='mode-toggle' />]}
          disableDefaultLinks={true}
          size={open ? 'default' : 'icon'}
          side={isMobile ? 'top' : 'right'}
          sideOffset={16}
          className='bg-primary-foreground text-primary hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        />
      </SidebarFooter>
    </Sidebar>
  );
}
