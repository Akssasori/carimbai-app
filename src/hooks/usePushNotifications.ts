import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

function applicationKey(value: string): ArrayBuffer {
  const raw = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, c => c.charCodeAt(0)).buffer;
}
export function usePushNotifications(customerId: number | undefined, token?: string) {
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const [permission, setPermission] = useState<NotificationPermission>(supported ? Notification.permission : 'default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    if (supported && token) {
      void (async () => {
        try {
          const preference = await apiService.privacy<{ enabled: boolean; noticeVersion: string }>('/notifications/preferences', token);
          const notice = await apiService.privacy<{ published: boolean; version: string }>('/privacy/notice');
          const registration = await navigator.serviceWorker.getRegistration();
          const subscription = await registration?.pushManager.getSubscription();
          if (!cancelled) setSubscribed(Boolean(subscription && preference.enabled && notice.published && preference.noticeVersion === notice.version));
        } catch { if (!cancelled) setSubscribed(false); }
      })();
    }
    return () => { cancelled = true; };
  }, [supported, token]);

  async function subscribe() {
    if (!customerId || !token || !supported || loading) return;
    setLoading(true); setError('');
    try {
      const notice = await apiService.privacy<{ published: boolean; version: string }>('/privacy/notice');
      if (!notice.published) throw new Error('Ativacao indisponivel: o aviso de privacidade ainda e um rascunho.');
      if (!window.confirm('Deseja receber avisos opcionais de atualizacao dos cartoes, sem publicidade? Voce pode desativar a qualquer momento em Privacidade. Consulte o aviso antes de continuar.')) return;
      const choice = await Notification.requestPermission(); setPermission(choice);
      if (choice !== 'granted') return;
      const { publicKey } = await apiService.getVapidPublicKey();
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      // Never reuse an endpoint possibly still linked to a previous account.
      const previous = await registration.pushManager.getSubscription();
      await previous?.unsubscribe();
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationKey(publicKey) });
      try {
        await apiService.privacy('/notifications/preferences', token, 'customer', 'PUT', { enabled: true, noticeVersion: notice.version });
        await apiService.subscribePush(customerId, subscription, token);
      } catch (e) { await subscription.unsubscribe(); throw e; }
      setSubscribed(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Nao foi possivel ativar notificacoes.'); }
    finally { setLoading(false); }
  }
  async function unsubscribe() {
    if (!token || loading) return;
    setLoading(true); setError('');
    try {
      await apiService.privacy('/notifications/subscriptions', token, 'customer', 'DELETE');
      setSubscribed(false);
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      await subscription?.unsubscribe();
    } catch { setError('Nao foi possivel concluir. Confira a escolha na central de privacidade.'); }
    finally { setLoading(false); }
  }
  return { permission, supported, subscribed, loading, error, subscribe, unsubscribe };
}
