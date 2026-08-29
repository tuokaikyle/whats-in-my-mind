import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { pageIntentions, type PageIntentionKey } from '@/utils/page-intentions';

export function PageInfo({ page }: { page: PageIntentionKey }) {
  const intention = pageIntentions[page];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type='button'
          className='inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          aria-label={`About the ${intention.title} view`}
        >
          <Info className='h-4 w-4' aria-hidden='true' />
        </button>
      </TooltipTrigger>
      <TooltipContent side='top' sideOffset={6} className='max-w-72 text-pretty'>
        {intention.description}
      </TooltipContent>
    </Tooltip>
  );
}
