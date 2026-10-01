import Link from "next/link";

import { BoxMark } from "./icons";

export function Wordmark() {
  return (
    <Link
      href="/"
      className="inline-flex min-h-[44px] items-center gap-2 rounded-key text-lg font-medium tracking-display text-gray-900"
    >
      <BoxMark size={22} />
      TopSoum
    </Link>
  );
}
