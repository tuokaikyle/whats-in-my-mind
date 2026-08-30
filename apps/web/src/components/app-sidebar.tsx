import { UserButton } from '@daveyplate/better-auth-ui';
import { Link, useLocation, useMatchRoute } from '@tanstack/react-router';
import {
  ArrowBigRight,
  ArrowBigRightDash,
  BatteryFull,
  Bubbles,
  Check,
  CircleCheck,
  CircleCheckIcon,
  CircleDashed,
  Command,
  FileCheck,
  Gauge,
  Info,
  LayoutGrid,
  PanelLeft,
  PlugZap,
  Settings2,
  SquareCheck,
  TrendingUp,
} from 'lucide-react';
import type * as React from 'react';
import { useEffect } from 'react';
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
import { pageMetadata } from '@/utils/page-metadata';

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
    // Views group
    {
      title: pageMetadata.simple.title,
      url: '/simple',
      icon: FileCheck,
      group: 'Views',
    },
    {
      title: pageMetadata.progress.title,
      url: '/progress',
      icon: TrendingUp,
      group: 'Views',
    },
    {
      title: pageMetadata.bubble.title,
      url: '/bubble',
      icon: Bubbles,
      group: 'Views',
    },
    {
      title: pageMetadata.treemap.title,
      url: '/treemap',
      icon: LayoutGrid,
      group: 'Views',
    },
    {
      title: pageMetadata.ring.title,
      url: '/ring',
      icon: CircleDashed,
      group: 'Views',
    },
    {
      title: pageMetadata.kpigauge.title,
      url: '/kpigauge',
      icon: Gauge,
      group: 'Views',
    },

    // Stages group
    {
      title: pageMetadata.readiness.title,
      url: '/readiness',
      icon: ArrowBigRight,
      group: 'Stages',
    },
    {
      title: pageMetadata.completed.title,
      url: '/completed',
      icon: SquareCheck,
      group: 'Stages',
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
  const location = useLocation();
  const { toggleSidebar, open, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();

  useEffect(() => {
    setOpenMobile(false);
  }, [location.pathname, setOpenMobile]);

  // Group items by their 'group' property
  const groupedNavMain = sidebarData.navMain.reduce(
    (acc, item) => {
      const group = item.group || 'Other';
      if (!acc[group]) acc[group] = [];
      acc[group].push(item);
      return acc;
    },
    {} as Record<string, typeof sidebarData.navMain>,
  );

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
                  <span className='truncate font-medium'>What's in my mind</span>
                  <span className='truncate text-xs'>Multiple views on one task</span>
                  {/* <span className='truncate text-xs'>A multi-view todo app</span> */}
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
                  <SidebarMenuButton asChild isActive={!!matchRoute({ to: item.url })}>
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
