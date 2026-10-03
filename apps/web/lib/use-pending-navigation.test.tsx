// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { usePendingNavigation } from "./use-pending-navigation";

describe("usePendingNavigation", () => {
  it("navigue vers l'URL demandee et n'est pas en attente au repos", () => {
    const { result } = renderHook(() => usePendingNavigation());

    expect(result.current.pending).toBe(false);
    act(() => result.current.navigate("/search?q=iphone%2015"));

    expect(push).toHaveBeenCalledWith("/search?q=iphone%2015");
  });
});
