import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export function LoadingSpinner({ size = 24, className }: LoadingSpinnerProps) {
  return (
    <Icons.loader
      className={cn("animate-spin text-primary", className)}
      size={size}
      aria-label="Loading..."
    />
  );
}
