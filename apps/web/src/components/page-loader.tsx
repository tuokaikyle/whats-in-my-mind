import { Loader2 } from 'lucide-react';

export function PageLoader({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const spinner = size === 'lg' ? 'h-8 w-8' : size === 'sm' ? 'h-4 w-4' : 'h-6 w-6';
  const padding = size === 'lg' ? 'py-8' : 'py-4';
  return (
    <div className={`flex justify-center ${padding} ${className ?? ''}`}>
      <Loader2 className={`${spinner} animate-spin`} />
    </div>
  );
}
