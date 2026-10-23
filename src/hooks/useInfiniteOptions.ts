import { useCallback, useEffect, useRef, useState } from 'react';
import { friendlyError } from '../lib/api';
import type { OptionItem, PaginatedOptionsResult } from '../types/mbta';

type Fetcher = (offset: number, signal?: AbortSignal) => Promise<PaginatedOptionsResult>;

/**
 * Hook generik untuk daftar opsi dengan infinite scroll.
 * Memuat halaman pertama saat `enabled` dan `depsKey` berubah,
 * lalu menyediakan loadMore() untuk halaman berikutnya.
 */
export function useInfiniteOptions(fetcher: Fetcher, depsKey: string, enabled: boolean) {
  const [items, setItems] = useState<OptionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const offsetRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const loadFirst = useCallback(async () => {
    if (!enabled) {
      setItems([]);
      setHasMore(false);
      setError(null);
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    offsetRef.current = 0;
    try {
      const result = await fetcherRef.current(0, ctrl.signal);
      if (ctrl.signal.aborted) return;
      setItems(result.items);
      setHasMore(result.hasMore);
      offsetRef.current = result.nextOffset;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setError(friendlyError(e));
      setItems([]);
      setHasMore(false);
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, [depsKey, enabled]);

  useEffect(() => {
    void loadFirst();
    return () => abortRef.current?.abort();
  }, [loadFirst]);

  const loadMore = useCallback(async () => {
    if (!enabled || !hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    try {
      const result = await fetcherRef.current(offsetRef.current);
      setItems((prev) => {
        const seen = new Set(prev.map((i) => i.id));
        return [...prev, ...result.items.filter((i) => !seen.has(i.id))];
      });
      setHasMore(result.hasMore);
      offsetRef.current = result.nextOffset;
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoadingMore(false);
    }
  }, [enabled, hasMore, loadingMore, loading]);

  return { items, loading, loadingMore, error, hasMore, loadMore, reload: loadFirst };
}
