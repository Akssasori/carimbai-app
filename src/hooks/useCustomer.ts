import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { CustomerData, CustomerLoginResponse, SocialProvider } from '../types';


const STORAGE_KEY = 'carimbai_customer';

export function useCustomer() {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);

  // carregar do localStorage na inicialização
  useEffect(() => {
    try {
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: CustomerLoginResponse = JSON.parse(stored);
        // FIX-02 Fase D — sessões antigas sem token (login-light) deixam de ser
        // válidas; força re-login social.
        if (!parsed.token) {
          localStorage.removeItem(STORAGE_KEY);
        } else {
          setCustomer(parsed);
        }
      }
    } catch (e) {
      console.error('Erro ao ler cliente do localStorage', e);
    } finally {
      setLoading(false);
    }
  }, []);

  async function socialLogin(provider: SocialProvider, token: string): Promise<CustomerLoginResponse> {
    const res = await apiService.socialLoginCustomer(provider, token);
    setCustomer(res);

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(res));
    }

    return res;
  }

  async function logout() {
    // FIX-11 / SEC-012 — revoga o JWT no backend antes de limpar o estado local.
    const token = customer?.token;
    setCustomer(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    await apiService.logout(token);
  }

  return {
    customer,
    loading,
    socialLogin,
    logout,
  };
}
