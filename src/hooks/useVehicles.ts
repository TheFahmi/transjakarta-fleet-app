import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchVehicles, friendlyError } from '../lib/api';
import type { Vehicle } from '../types/mbta';

interface UseVehiclesParams {
  page: number;
  perPage: number;
  routeIds: string[];
  tripIds: string[];
  refreshKey: number;
}

export function useVehicles({ page, perPage, routeIds, tripIds, refreshKey }: UseVehiclesParams) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staleError, setStaleError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const routeKey = routeIds.join(',');
  const tripKey = tripIds.join(',');

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent === true;
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
        setError(null);
      }
      try {
        const result = await fetchVehicles({
          page,
          perPage,
          routeIds: routeKey ? routeKey.split(',') : [],
          tripIds: tripKey ? tripKey.split(',') : [],
          signal: ctrl.signal,
        });
        if (ctrl.signal.aborted) return;
        setVehicles(result.vehicles);
        setTotalPages(result.totalPages);
        setTotalCount(result.totalCountEstimate);
        setLastUpdatedAt(new Date());
        setStaleError(null);
        if (silent) setError(null);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        if (silent) {
          // Refresh diam-diam gagal: pertahankan data terakhir, beri tahu lewat staleError
          setStaleError(friendlyError(e));
        } else {
          setError(friendlyError(e));
          setVehicles([]);
        }
      } finally {
        if (!ctrl.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [page, perPage, routeKey, tripKey, refreshKey],
  );

  const refetch = useCallback(() => load(), [load]);
  const silentRefetch = useCallback(() => load({ silent: true }), [load]);

  useEffect(() => {
    void load();
    return () => abortRef.current?.abort();
  }, [load]);

  return {
    vehicles,
    loading,
    refreshing,
    error,
    staleError,
    lastUpdatedAt,
    totalPages,
    totalCount,
    refetch,
    silentRefetch,
  };
}
