import { Outlet, useMatches } from '@tanstack/react-router';
import { AppSidebar, sidebarData } from '@/components/app-sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ModeToggle } from './mode-toggle';

export default function Layout() {
  const matches = useMatches();
  const currentPath = matches[matches.length - 1]?.pathname || '/';

  // Find current page title
  let currentPageTitle = 'Simple';

  for (const navItem of sidebarData.navMain) {
    if (navItem.url === currentPath) {
      currentPageTitle = navItem.title;
      break;
    }
  }
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className='flex flex-col'>
        <header className='flex h-16 shrink-0 items-center justify-between gap-2 border-b md:hidden'>
          <div className='flex items-center gap-2 px-4'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='mr-2 data-[orientation=vertical]:h-4' />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>{currentPageTitle}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className='px-4'>
            <ModeToggle />
          </div>
        </header>
        <div className='flex-1 overflow-y-auto'>
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
