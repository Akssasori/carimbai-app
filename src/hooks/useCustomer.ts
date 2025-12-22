import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { CustomerData, CustomerLoginRequest, CustomerLoginResponse } from '../types';


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
        setCustomer(parsed);
      }
    } catch (e) {
      console.error('Erro ao ler cliente do localStorage', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // login ou cadastro (login light)
  async function loginOrRegister(payload: CustomerLoginRequest): Promise<CustomerLoginResponse> {
    const res = await apiService.loginOrRegisterCustomer(payload);
    console.log('login response', res);
    setCustomer(res);

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(res));
    }

    return res;
  }

  function logout() {
    setCustomer(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  return {
    customer,
    loading,
    loginOrRegister,
    logout,
  };
}