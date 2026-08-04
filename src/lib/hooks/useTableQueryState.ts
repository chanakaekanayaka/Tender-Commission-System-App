"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const SEARCH_DEBOUNCE_MS = 400;

interface UseTableQueryStateParams {
  search: string;
  page: number;
}

interface UseTableQueryStateResult {
  search: string;
  page: number;
  setSearch: (value: string) => void;
  setPage: (page: number) => void;
}

/**
 * Drives a table's `?search=&page=` URL params from a client component, without `useSearchParams()`
 * (avoids the Suspense-boundary requirement it forces) — current values instead arrive as props
 * from the Server Component that already read them off `searchParams`. Search is debounced and
 * resets to page 1 on change; paging is immediate and keeps the current search term. Uses
 * `router.replace` (not `push`) so typing/paging doesn't spam browser history.
 */
export function useTableQueryState({ search, page }: UseTableQueryStateParams): UseTableQueryStateResult {
  const router = useRouter();
  const pathname = usePathname();
  const [localSearch, setLocalSearch] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resets the input when `search` changes for a reason other than this hook's own debounced
  // navigate() (e.g. browser back/forward, or a fresh page load) — adjusted during render per
  // React's guidance instead of in an effect, so there's no extra render/flash of stale text.
  const [prevSearch, setPrevSearch] = useState(search);
  if (search !== prevSearch) {
    setPrevSearch(search);
    setLocalSearch(search);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const navigate = (nextSearch: string, nextPage: number) => {
    const params = new URLSearchParams();
    if (nextSearch) params.set("search", nextSearch);
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const setSearch = (value: string) => {
    setLocalSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => navigate(value, 1), SEARCH_DEBOUNCE_MS);
  };

  const setPage = (nextPage: number) => {
    navigate(localSearch, nextPage);
  };

  return { search: localSearch, page, setSearch, setPage };
}
