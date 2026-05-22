import { getUserFacingMessage } from '../api/core/errors';
import { useCallback, useEffect, useRef, useState } from 'react';

type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

export function useApi<T>(loader: () => Promise<T>) {
  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  }, [loader]);

  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  const [state, setState] = useState<AsyncState<T>>({ status: 'idle' });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setState({ status: 'loading' });
    try {
      const data = await loaderRef.current();
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }
      setState({ status: 'success', data });
    } catch (error) {
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }
      setState({ status: 'error', error: getUserFacingMessage(error) });
    }
  }, []);

  useEffect(() => {
    void run();
  }, [run]);

  return { state, reload: run };
}
