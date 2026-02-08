import { RiLoader2Fill } from '@remixicon/react';
import { cn } from '@/lib/utils';

export function Spinner({ className, ...props }: React.ComponentProps<typeof RiLoader2Fill>) {
  return (
    <RiLoader2Fill
      role="status"
      aria-label="Loading"
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  );
}

export function SpinnerDotted() {
  return (
    <div className="flex items-center gap-4">
      <Spinner />
    </div>
  );
}
