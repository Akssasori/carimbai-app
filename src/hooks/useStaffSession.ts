import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MerchantInfo } from '../types';
import { apiService } from '../services/api';

export interface StaffSession {
  token: string;
  refreshToken: string;
  staffId: number;
  role: 'ADMIN' | 'CASHIER';
  merchantId: number;
  merchants: MerchantInfo[];
}

const STORAGE_KEY = 'carimbai_staff_session';

export function useStaffSession() {
  const navigate = useNavigate();
  const [session, setSession] = useState<StaffSession | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StaffSession;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!session) {
      navigate('/staff', { replace: true });
    }
  }, [session, navigate]);

  const logout = () => {
    // Snapshot do refresh token antes de limpar — apos clear, perdemos.
    const rt = session?.refreshToken;
    setSession(null);
    localStorage.removeItem(STORAGE_KEY);
    navigate('/staff', { replace: true });
    // Best-effort: revogar no servidor. Nao bloqueia a UX se falhar.
    if (rt) {
      apiService.logoutStaff(rt);
    }
  };

  return { session, logout };
}
