import { UserButton } from '@daveyplate/better-auth-ui';
import { useMatchRoute } from '@tanstack/react-router';
import {
  Brain,
  Bubbles,
  Command,
  FileCheck,
  Grid2X2,
  HomeIcon,
  Info,
  PanelLeft,
  SquareArrowRight,
  Table2,
} from 'lucide-react';
import type * as React from 'react';
import { useCallback, useState } from 'react';
import { NavMain } from '@/components/nav-main';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { ModeToggle } from './mode-toggle';

const COLLAPSIBLE_STORAGE_KEY = 'sidebar-open-items';

function loadOpenItems(): Set<string> {
  try {
    const raw = localStorage.getItem(COLLAPSIBLE_STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return new Set();
}

function saveOpenItems(items: Set<string>) {
  localStorage.setItem(COLLAPSIBLE_STORAGE_KEY, JSON.stringify([...items]));
}

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
      icon: FileCheck,
    },
    {
      title: 'Table',
      url: '/table',
      icon: Table2,
    },
    {
      title: 'Slide',
      url: '/slide',
      icon: SquareArrowRight,
    },
    {
      title: 'Bubble',
      url: '/bubble',
      icon: Bubbles,
    },
    {
      title: 'Voronoi',
      url: '/voronoi',
      icon: Brain,
      items: [
        {
          title: 'Rectangular',
          url: '/voronoi/rectangular',
        },
        {
          title: 'Head Side',
          url: '/voronoi/head-side',
        },
        {
          title: 'Brain',
          url: '/voronoi/brain',
        },
        {
          title: 'Shirt',
          url: '/voronoi/shirt',
        },
      ],
    },
    {
      title: 'Grid',
      url: '/grid',
      icon: Grid2X2,
    },
    {
      title: 'About',
      url: '/about',
      icon: Info,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const matchRoute = useMatchRoute();
  const { toggleSidebar, open } = useSidebar();
  const isMobile = useIsMobile();

  // Persisted collapsible open/closed state
  const [openItems, setOpenItems] = useState<Set<string>>(loadOpenItems);
  const [navKey, setNavKey] = useState(0);

  const handleSidebarClick = useCallback((e: React.MouseEvent) => {
    const trigger = (e.target as HTMLElement).closest(
      '[data-slot="collapsible-trigger"]'
    ) as HTMLElement | null;
    if (!trigger) return;

    const titleEl = trigger.querySelector('span');
    const title = titleEl?.textContent;
    if (!title) return;

    // Determine if this click is opening or closing
    const collapsible = trigger.closest('[data-slot="collapsible"]');
    const isCurrentlyOpen = collapsible?.getAttribute('data-state') === 'open';

    setOpenItems((prev) => {
      const next = new Set(prev);
      if (isCurrentlyOpen) {
        next.delete(title);
      } else {
        next.add(title);
      }
      saveOpenItems(next);
      return next;
    });
    setNavKey((k) => k + 1);
  }, []);

  const navMainWithActive = sidebarData.navMain.map((item) => ({
    ...item,
    // For collapsible items, `isActive` is only used as `defaultOpen` in NavMain.
    // Override it with persisted state so reopening the page restores the sidebar.
    isActive: item.items
      ? openItems.has(item.title) || !!matchRoute({ to: item.url })
      : !!matchRoute({ to: item.url }),
  }));

  return (
    <Sidebar collapsible='icon' {...props}>
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
      <SidebarContent onClick={handleSidebarClick}>
        <NavMain key={navKey} items={navMainWithActive} />
      </SidebarContent>
      <SidebarFooter className='mb-1'>
        <UserButton
          additionalLinks={[<ModeToggle key='mode-toggle' />]}
          size={open ? 'default' : 'icon'}
          side={isMobile ? 'top' : 'right'}
          sideOffset={16}
          className='bg-primary-foreground text-primary hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        />
      </SidebarFooter>
    </Sidebar>
  );
}
