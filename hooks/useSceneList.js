/**
 * Hook to subscribe to the scenes list in realtime.
 */

'use client';

import { useState, useEffect } from 'react';
import { subscribeSceneList } from '@/lib/scenes';

export function useSceneList() {
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const unsubscribe = subscribeSceneList((list) => {
        setScenes(list);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  }, []);

  return { scenes, loading, error };
}
