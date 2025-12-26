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

const cristo = [
  {
    cid: 1,
    chapterName: "Marseille.--L'arrivée.",
  },
  {
    cid: 2,
    chapterName: 'Le père et le fils.',
  },
  {
    cid: 3,
    chapterName: 'Les Catalans.',
  },
  {
    cid: 4,
    chapterName: 'Complot.',
  },
  {
    cid: 5,
    chapterName: 'Le repas des fiançailles.',
  },
  {
    cid: 6,
    chapterName: 'Le substitut du procureur du roi.',
  },
  {
    cid: 7,
    chapterName: "L'interrogatoire.",
  },
  {
    cid: 8,
    chapterName: "Le château d'If.",
  },
  {
    cid: 9,
    chapterName: 'Le soir des fiançailles.',
  },
  {
    cid: 10,
    chapterName: 'Le petit cabinet des Tuileries.',
  },
];

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
      title: 'Cristo',
      url: '/cristo',
      icon: SquareTerminal,
      items: cristo.map((chapter, index) => ({
        title: `${index + 1}. ${chapter.chapterName}`,
        url: `/cristo/${chapter.cid}`,
      })),
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
