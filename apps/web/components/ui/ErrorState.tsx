interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  className?: string;
}

export function ErrorState({ message, onRetry, className = "" }: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-start gap-2 rounded-card border border-gray-200 p-4 ${className}`}>
      <p className="text-sm text-gray-600">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="min-h-[44px] min-w-[44px] rounded-full border border-accent px-4 text-sm font-medium text-accent"
      >
        Reessayer
      </button>
    </div>
  );
}
