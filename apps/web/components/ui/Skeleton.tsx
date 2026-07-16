interface SkeletonProps {
  className?: string;
}

export function SkeletonBlock({ className = "" }: SkeletonProps) {
  return <div className={`animate-pulse rounded-card bg-gray-200 ${className}`} />;
}

export function SkeletonLine({ className = "" }: SkeletonProps) {
  return <div className={`h-3 animate-pulse rounded-full bg-gray-200 ${className}`} />;
}
