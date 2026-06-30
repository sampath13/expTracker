import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  Permission,
  openSettings,
} from 'react-native-permissions';

type PermissionStatus = 'granted' | 'denied' | 'blocked' | 'unavailable' | 'undetermined';

interface UsePermissionResult {
  status: PermissionStatus;
  isLoading: boolean;
  check: () => Promise<void>;
  request: () => Promise<void>;
  openSettings: () => Promise<void>;
}

export function usePermission(permission: Permission): UsePermissionResult {
  const [status, setStatus] = useState<PermissionStatus>('undetermined');
  const [isLoading, setIsLoading] = useState(true);

  const checkPermission = useCallback(async () => {
    try {
      const result = await check(permission);
      setStatus(mapResult(result));
    } catch {
      setStatus('unavailable');
    } finally {
      setIsLoading(false);
    }
  }, [permission]);

  const requestPermission = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await request(permission);
      setStatus(mapResult(result));
    } catch {
      setStatus('unavailable');
    } finally {
      setIsLoading(false);
    }
  }, [permission]);

  const openAppSettings = useCallback(async () => {
    try {
      await openSettings();
    } catch {
      // Settings open failed silently
    }
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    status,
    isLoading,
    check: checkPermission,
    request: requestPermission,
    openSettings: openAppSettings,
  };
}

function mapResult(result: string): PermissionStatus {
  switch (result) {
    case RESULTS.GRANTED:
    case RESULTS.LIMITED:
      return 'granted';
    case RESULTS.DENIED:
      return 'denied';
    case RESULTS.BLOCKED:
      return 'blocked';
    case RESULTS.UNAVAILABLE:
      return 'unavailable';
    default:
      return 'undetermined';
  }
}
