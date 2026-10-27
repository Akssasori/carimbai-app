import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MerchantInfo } from '../types';
import { apiService } from '../services/api';
import { readStaffSession, STAFF_SESSION_EVENT } from '../services/staffSession';

export interface StaffSession {
  token: string;
  refreshToken: string;
  staffId: number;
  role: 'ADMIN' | 'CASHIER';
  merchantId: number;
  merchants: MerchantInfo[];
  expiresAt: number;
}

const STORAGE_KEY = 'carimbai_staff_session';

export function useStaffSession() {
  const navigate = useNavigate();
  const [session, setSession] = useState<StaffSession | null>(() => readStaffSession<StaffSession>());

  useEffect(() => {
    const update = () => setSession(readStaffSession<StaffSession>());
    window.addEventListener(STAFF_SESSION_EVENT, update);
    window.addEventListener('storage', update);
    const expiry = window.setInterval(update, 30000);
    return () => {
      window.removeEventListener(STAFF_SESSION_EVENT, update);
      window.removeEventListener('storage', update);
      window.clearInterval(expiry);
    };
  }, []);

  useEffect(() => {
    if (!session) {
      navigate('/staff', { replace: true });
    }
  }, [session, navigate]);

  const logout = () => {
    // Read rotated credentials before clearing the local session.
    const current = readStaffSession<StaffSession>() ?? session;
    setSession(null);
    localStorage.removeItem(STORAGE_KEY);
    navigate('/staff', { replace: true });
    // Best-effort: revogar no servidor. Nao bloqueia a UX se falhar.
    void apiService.logoutStaff(current?.token, current?.refreshToken);
  };

  return { session, setSession, logout };
}
