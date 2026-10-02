import Link from "next/link";

import { BoxMark } from "./icons";

/** compact : sous 420 px, seul le glyphe reste visible pour laisser la place a la recherche. */
export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="inline-flex min-h-[44px] min-w-[44px] flex-none items-center gap-2 rounded-key text-lg font-medium tracking-display text-gray-900"
    >
      <BoxMark size={22} />
      <span className={compact ? "max-[419px]:sr-only" : undefined}>TopSoum</span>
    </Link>
  );
}
