interface SkeletonProps {
  className?: string;
}

export function SkeletonBlock({ className = "" }: SkeletonProps) {
  return <div className={`animate-pulse rounded-key bg-gray-100 ${className}`} />;
}

export function SkeletonLine({ className = "" }: SkeletonProps) {
  return <div className={`h-3 animate-pulse rounded-full bg-gray-100 ${className}`} />;
}
