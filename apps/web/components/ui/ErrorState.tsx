import { Button } from "./Button";

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
      <Button type="button" variant="secondary" onClick={onRetry}>
        Réessayer
      </Button>
    </div>
  );
}
