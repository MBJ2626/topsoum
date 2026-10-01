interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  className?: string;
}

export function ErrorState({ message, onRetry, className = "" }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-start gap-3 rounded-card border border-gray-200 bg-white p-4 ${className}`}
    >
      <p className="text-sm text-gray-600">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="min-h-[44px] min-w-[44px] rounded-key border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 transition-colors hover:border-gray-400 active:scale-[0.98]"
      >
        Réessayer
      </button>
    </div>
  );
}
