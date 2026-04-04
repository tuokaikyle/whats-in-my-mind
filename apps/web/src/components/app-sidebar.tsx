'use client';

import { UserButton } from '@daveyplate/better-auth-ui';
import { useMatchRoute } from '@tanstack/react-router';
import { ChevronLeft, Code, Command, ExternalLink, ExternalLinkIcon, HomeIcon, PanelLeft, Satellite, Send, SquareTerminal, type LucideIcon } from 'lucide-react';
import type * as React from 'react';
import { NavMain } from '@/components/nav-main';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { ModeToggle } from './mode-toggle';

export const sidebarData = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  navMain: [
    {
      title: 'Home',
      url: '/',
      icon: HomeIcon,
    },
    {
      title: 'Simple',
      url: '/simple',
      icon: Satellite
    },
    {
      title: 'Rich ',
      url: '/rich',
    },
    {
      title: 'Placeholder',
      url: '/placeholder',
      icon: SquareTerminal,
      items: [
        {
          title: 'Placeholder 1',
          url: '/placeholder/1',
        },
        {
          title: 'Placeholder 2',
          url: '/placeholder/2',
        }]
    },
    {
      title: 'About',
      url: '/about',
      icon: HomeIcon,
    },
  ]
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const matchRoute = useMatchRoute();
  const { toggleSidebar, open } = useSidebar();
  const isMobile = useIsMobile();

  const navMainWithActive = sidebarData.navMain.map((item) => ({
    ...item,
    isActive: !!matchRoute({ to: item.url }),
  }));

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' onClick={toggleSidebar} asChild>
              <div className='group'>
                <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
                  <Command className='size-4' />
                </div>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium'>Acme Inc</span>
                  <span className='truncate text-xs'>Fullstack template</span>
                </div>
                <PanelLeft className='size-4' />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainWithActive} />
      </SidebarContent>
      <SidebarFooter className='mb-1'>
        <UserButton
          additionalLinks={[<ModeToggle key="mode-toggle" />]}
          size={open ? 'default' : 'icon'}
          side={isMobile ? 'top' : 'right'}
          sideOffset={16}
          className='bg-primary-foreground text-primary hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        />
      </SidebarFooter>
    </Sidebar>
  );
}
