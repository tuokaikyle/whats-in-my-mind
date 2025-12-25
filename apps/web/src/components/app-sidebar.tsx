'use client';

import * as React from 'react';
import {
  BookOpen,
  Bot,
  Code,
  Command,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
} from 'lucide-react';

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
import { ModeToggle } from './mode-toggle';
import { UserButton } from '@daveyplate/better-auth-ui';
import { useMatchRoute } from '@tanstack/react-router';

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
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: SquareTerminal,
    },
    {
      title: 'Todos',
      url: '/todos',
      icon: SquareTerminal,
    },
    {
      title: 'Notes',
      url: '/notes',
      icon: SquareTerminal,
      items: [
        {
          title: 'Jan',
          url: 'jan',
        },
        {
          title: 'Feb',
          url: 'feb',
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: 'Github',
      url: 'https://github.com/tuokaikyle/OverchargedList',
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
              <a href='#'>
                <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                  <Command className='size-4' />
                </div>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium'>Acme Inc</span>
                  <span className='truncate text-xs'>Fullstack template</span>
                </div>
              </a>
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
