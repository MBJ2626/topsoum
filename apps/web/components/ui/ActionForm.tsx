"use client";

import { useActionState, type ReactNode } from "react";

import { Button } from "./Button";

interface ActionFormProps {
  action: (formData: FormData) => Promise<void>;
  submitLabel: ReactNode;
  variant?: "primary" | "secondary";
  size?: "md" | "lg";
  className?: string;
  children?: ReactNode;
}

/** Formulaire de server action dont le bouton est desactive pendant l'envoi (anti double-clic). */
export function ActionForm({ action, submitLabel, variant, size, className = "", children }: ActionFormProps) {
  const [, formAction, isPending] = useActionState(async (_state: null, formData: FormData) => {
    await action(formData);
    return null;
  }, null);

  return (
    <form action={formAction} className={className}>
      {children}
      <Button type="submit" variant={variant} size={size} disabled={isPending} className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
