import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { GripVertical } from 'lucide-react';
import { motion, useMotionValue, animate } from 'framer-motion';

import { cn } from '../../lib/utils';

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, onValueChange, onValueCommit, ...props }, ref) => {
  const startValueRef = React.useRef(0);
  const prevValueRef = React.useRef(0);
  const offsetX = useMotionValue(0);

  const handleValueChange = (value: number[]) => {
    const currentValue = value[0];

    // Track velocity by comparing consecutive values
    const delta = currentValue - prevValueRef.current;
    if (Math.abs(delta) > 0) {
      // Store the direction/velocity
      startValueRef.current = delta;
    }
    prevValueRef.current = currentValue;

    onValueChange?.(value);
  };

  const handleValueCommit = (value: number[]) => {
    // Use the stored velocity/direction for momentum
    const rawMomentum = startValueRef.current * 5;
    // Clamp momentum to max 5 units
    const momentum =
      Math.sign(rawMomentum) * Math.min(Math.abs(rawMomentum), 5);

    // Animate with momentum in the drag direction
    animate(offsetX, momentum, {
      duration: 0.5,
      ease: 'easeOut',
    });

    // Reset for next drag
    startValueRef.current = 0;

    onValueCommit?.(value);
  };

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        'relative flex w-full touch-none select-none items-center',
        className
      )}
      onValueChange={handleValueChange} // can have momentum
      onValueCommit={handleValueCommit}
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
        asChild
      >
        <motion.span
          style={{ x: offsetX }}
          transition={{ type: 'spring', stiffness: 150, damping: 10 }}
        >
          <GripVertical className='h-6 w-6' />
        </motion.span>
      </SliderPrimitive.Thumb>
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
