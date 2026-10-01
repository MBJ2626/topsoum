import type { ReactNode } from "react";

interface PanelProps {
  title: string;
  /** Element a droite du titre (compteur, lien). */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}

// Une face de boite : carton blanc, coins 16 px, arete fine, jamais d'ombre.
export function Panel({ title, aside, children, className = "" }: PanelProps) {
  return (
    <section className={`rounded-card border border-gray-200 bg-white p-4 sm:p-6 ${className}`}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-base font-medium text-gray-900">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
