import { useEffect, useRef, useCallback, useState } from 'react';
import type { CardSseEvent } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1234/api';

interface UseCardEventsOptions {
  cardId: number | null;
  enabled: boolean;
  onStampApplied: (event: CardSseEvent) => void;
  onRedeemed: (event: CardSseEvent) => void;
  onConnectionFailed: () => void;
}

export function useCardEvents({
  cardId,
  enabled,
  onStampApplied,
  onRedeemed,
  onConnectionFailed,
}: UseCardEventsOptions) {
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onStampAppliedRef = useRef(onStampApplied);
  const onRedeemedRef = useRef(onRedeemed);
  const onConnectionFailedRef = useRef(onConnectionFailed);

  onStampAppliedRef.current = onStampApplied;
  onRedeemedRef.current = onRedeemed;
  onConnectionFailedRef.current = onConnectionFailed;

  const close = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setConnected(false);
  }, []);

  useEffect(() => {
    if (!enabled || cardId == null) {
      close();
      return;
    }

    const url = `${API_BASE_URL}/cards/${cardId}/events`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    timeoutRef.current = setTimeout(() => {
      if (es.readyState !== EventSource.OPEN) {
        es.close();
        setConnected(false);
        onConnectionFailedRef.current();
      }
    }, 3000);

    es.onopen = () => {
      setConnected(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    es.addEventListener('stamp_applied', (e: MessageEvent) => {
      try {
        const data: CardSseEvent = JSON.parse(e.data);
        onStampAppliedRef.current(data);
      } catch { /* ignore malformed */ }
    });

    es.addEventListener('redeemed', (e: MessageEvent) => {
      try {
        const data: CardSseEvent = JSON.parse(e.data);
        onRedeemedRef.current(data);
      } catch { /* ignore malformed */ }
    });

    es.onerror = () => {
      setConnected(false);
      es.close();
      eventSourceRef.current = null;
      onConnectionFailedRef.current();
    };

    return () => {
      close();
    };
  }, [cardId, enabled, close]);

  return { connected, close };
}
