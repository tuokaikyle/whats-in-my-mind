import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { GripVertical } from 'lucide-react';

import { cn } from '../../lib/utils';

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        'relative flex w-full touch-none select-none items-center',
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track className='relative h-10 w-full grow overflow-hidden bg-rose-500'>
        <SliderPrimitive.Range className='absolute h-full bg-green-500' />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className='flex h-10 w-10 items-center justify-center border-1 border-gray-500 
                  bg-background ring-offset-background transition-colors 
                  focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring 
                  disabled:pointer-events-none disabled:opacity-50'
      >
        <GripVertical className='h-6 w-6' />
      </SliderPrimitive.Thumb>
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
