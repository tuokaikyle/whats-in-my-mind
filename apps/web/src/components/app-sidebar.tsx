'use client';

import { UserButton } from '@daveyplate/better-auth-ui';
import { useMatchRoute } from '@tanstack/react-router';
import { Code, Command, Send, SquareTerminal } from 'lucide-react';
import type * as React from 'react';
import { NavMain } from '@/components/nav-main';
import { NavSecondary } from '@/components/nav-secondary';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

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
      items: [
        {
          title: 'Simple',
          url: '/simple',
        },
        {
          title: 'Bubble',
          url: '/bubble',
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: 'Github',
      url: 'https://github.com/tuokaikyle',
      icon: Code,
    },
    {
      title: 'Feedback',
      url: '#',
      icon: Send,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const matchRoute = useMatchRoute();

  const navMainWithActive = sidebarData.navMain.map((item) => ({
    ...item,
    isActive: !!matchRoute({ to: item.url }),
  }));

  return (
    <Sidebar variant='inset' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' asChild>
              <div>
                <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
                  <Command className='size-4' />
                </div>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium'>Acme Inc</span>
                  <span className='truncate text-xs'>Fullstack template</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainWithActive} />
        <NavSecondary items={sidebarData.navSecondary} className='mt-auto' />
      </SidebarContent>
      <SidebarFooter>
        <UserButton
          size='default'
          side='right'
          sideOffset={16}
          className='bg-primary-foreground text-primary hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        />
      </SidebarFooter>
    </Sidebar>
  );
}
