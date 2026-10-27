import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { readCustomerSession, writeCustomerSession, clearCustomerSession } from '../services/customerSession';
import type { CustomerData, CustomerLoginResponse, SocialProvider } from '../types';

export function useCustomer() {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    const saved = readCustomerSession();
    const restore = async () => {
      try {
        if (saved) {
          const profile = await apiService.privacy<{ name?: string; email?: string; phone?: string }>('/privacy/me/profile', saved.token);
          if (!cancelled) setCustomer({ ...saved, ...profile });
        }
      } catch { clearCustomerSession(); }
      finally { if (!cancelled) setLoading(false); }
    };
    void restore();
    return () => { cancelled = true; };
  }, []);

  async function socialLogin(provider: SocialProvider, token: string): Promise<CustomerLoginResponse> {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription && !await subscription.unsubscribe()) throw new Error('Nao foi possivel desvincular as notificacoes anteriores deste dispositivo.');
    }
    const result = await apiService.socialLoginCustomer(provider, token);
    if (!result.token) throw new Error('Sessao nao recebida.');
    writeCustomerSession({ customerId: result.customerId, token: result.token });
    setCustomer(result);
    return result;
  }

  async function logout() {
    const token = customer?.token;
    setCustomer(null);
    clearCustomerSession();
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        if (subscription) {
          // Provider revocation also prevents delivery to a restored stale endpoint.
          await subscription.unsubscribe();
          if (token) await apiService.privacy('/notifications/unsubscribe-device', token, 'customer', 'POST', { endpoint: subscription.endpoint });
        }
      }
    } catch { /* Local logout still completes when the provider or server is offline. */ }
    await apiService.logout(token);
  }
  return { customer, loading, socialLogin, logout };
}
