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
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const routeKey = routeIds.join(',');
  const tripKey = tripIds.join(',');

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
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
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setError(friendlyError(e));
      setVehicles([]);
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, [page, perPage, routeKey, tripKey, refreshKey]);

  useEffect(() => {
    void load();
    return () => abortRef.current?.abort();
  }, [load]);

  return { vehicles, loading, error, totalPages, totalCount, refetch: load };
}
