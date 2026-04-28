/**
 * TruthBridge — useBridges hook
 */
import { useState, useEffect } from 'react';
import { getBridges, getBridgeById } from '../lib/bridges';

export function useBridges(filters = {}) {
  const [bridges, setBridges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getBridges(filters)
      .then(({ data }) => setBridges(data || []))
      .catch(setError)
      .finally(() => setLoading(false));
  }, [JSON.stringify(filters)]);

  return { bridges, loading, error, refetch: () => getBridges(filters).then(({ data }) => setBridges(data || [])) };
}

export function useBridge(id) {
  const [bridge, setBridge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getBridgeById(id)
      .then(setBridge)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id]);

  return { bridge, loading, error };
}
