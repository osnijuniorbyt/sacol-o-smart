import { useState, useEffect, useCallback } from 'react';

const CACHE_PREFIX = 'offline_cache_';
const CACHE_METADATA_KEY = 'offline_cache_metadata';

interface CacheMetadata {
  [key: string]: {
    lastUpdated: string;
    expiresAt: string;
  };
}

interface UseOfflineCacheOptions<T> {
  key: string;
  fetchFn: () => Promise<T>;
  ttlMinutes?: number; // Time to live in minutes
  onCacheMiss?: () => void;
  onCacheHit?: () => void;
}

export function useOfflineCache<T>({
  key,
  fetchFn,
  ttlMinutes = 60, // Default 1 hour
  onCacheMiss,
  onCacheHit,
}: UseOfflineCacheOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const cacheKey = `${CACHE_PREFIX}${key}`;

  // Get metadata for all caches
  const getMetadata = useCallback((): CacheMetadata => {
    try {
      const stored = localStorage.getItem(CACHE_METADATA_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }, []);

  // Update metadata for a specific cache
  const updateMetadata = useCallback((ttl: number) => {
    const metadata = getMetadata();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl * 60 * 1000);
    
    metadata[key] = {
      lastUpdated: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
    
    localStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));
    setLastUpdated(now);
  }, [key, getMetadata]);

  // Check if cache is expired
  const isCacheExpired = useCallback((): boolean => {
    const metadata = getMetadata();
    const cacheInfo = metadata[key];
    
    if (!cacheInfo) return true;
    
    const expiresAt = new Date(cacheInfo.expiresAt);
    return new Date() > expiresAt;
  }, [key, getMetadata]);

  // Save data to cache
  const saveToCache = useCallback((newData: T) => {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(newData));
      updateMetadata(ttlMinutes);
    } catch (e) {
      console.warn('Failed to save to cache:', e);
      // If localStorage is full, try to clear old caches
      clearExpiredCaches();
    }
  }, [cacheKey, ttlMinutes, updateMetadata]);

  // Load data from cache
  const loadFromCache = useCallback((): T | null => {
    try {
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        const metadata = getMetadata();
        if (metadata[key]?.lastUpdated) {
          setLastUpdated(new Date(metadata[key].lastUpdated));
        }
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load from cache:', e);
    }
    return null;
  }, [cacheKey, key, getMetadata]);

  // Clear expired caches
  const clearExpiredCaches = useCallback(() => {
    const metadata = getMetadata();
    const now = new Date();
    
    Object.entries(metadata).forEach(([cacheKeyName, info]) => {
      if (new Date(info.expiresAt) < now) {
        localStorage.removeItem(`${CACHE_PREFIX}${cacheKeyName}`);
        delete metadata[cacheKeyName];
      }
    });
    
    localStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));
  }, [getMetadata]);

  // Force clear this specific cache
  const clearCache = useCallback(() => {
    localStorage.removeItem(cacheKey);
    const metadata = getMetadata();
    delete metadata[key];
    localStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));
    setLastUpdated(null);
  }, [cacheKey, key, getMetadata]);

  // Fetch fresh data
  const fetchData = useCallback(async (forceRefresh = false) => {
    // If offline and have cache, use it
    if (!navigator.onLine) {
      const cached = loadFromCache();
      if (cached) {
        setData(cached);
        setIsFromCache(true);
        setIsLoading(false);
        onCacheHit?.();
        return cached;
      }
      setError(new Error('Sem conexão e sem dados em cache'));
      setIsLoading(false);
      return null;
    }

    // Check if cache is still valid and not forcing refresh
    if (!forceRefresh && !isCacheExpired()) {
      const cached = loadFromCache();
      if (cached) {
        setData(cached);
        setIsFromCache(true);
        setIsLoading(false);
        onCacheHit?.();
        
        // Still try to refresh in background
        fetchFn().then(freshData => {
          setData(freshData);
          saveToCache(freshData);
          setIsFromCache(false);
        }).catch(() => {
          // Silent fail for background refresh
        });
        
        return cached;
      }
    }

    // Fetch fresh data
    setIsLoading(true);
    setError(null);
    
    try {
      const freshData = await fetchFn();
      setData(freshData);
      saveToCache(freshData);
      setIsFromCache(false);
      onCacheMiss?.();
      return freshData;
    } catch (e) {
      // On error, try to use cached data
      const cached = loadFromCache();
      if (cached) {
        setData(cached);
        setIsFromCache(true);
        onCacheHit?.();
        return cached;
      }
      setError(e as Error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, loadFromCache, saveToCache, isCacheExpired, onCacheHit, onCacheMiss]);

  // Refresh data (force fetch from server)
  const refresh = useCallback(() => fetchData(true), [fetchData]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, []);

  // Listen for online event to refresh
  useEffect(() => {
    const handleOnline = () => {
      // Refresh data when coming back online
      fetchData(true);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    isFromCache,
    lastUpdated,
    refresh,
    clearCache,
  };
}

// Utility hook to check online status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
