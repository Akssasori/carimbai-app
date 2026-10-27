export const STAFF_STORAGE_KEY = 'carimbai_staff_session';
export const STAFF_SESSION_EVENT = 'carimbai:staff-session';

export interface StaffSessionSnapshot {
  token: string;
  refreshToken?: string;
  staffId: number;
  merchantId: number;
  expiresAt: number;
}

export function readStaffSession<T extends StaffSessionSnapshot>(): T | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STAFF_STORAGE_KEY) ?? 'null');
    if (!value || typeof value !== 'object') return null;
    const session = value as T;
    if (typeof session.token !== 'string' || !Number.isSafeInteger(session.staffId)
      || !Number.isSafeInteger(session.merchantId) || !Number.isFinite(session.expiresAt)
      || session.expiresAt <= Date.now()) {
      localStorage.removeItem(STAFF_STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function belongsToSession(token: string, session: StaffSessionSnapshot | null): boolean {
  if (!session) return false;
  if (token === session.token) return true;
  try {
    const decode = (value: string): Record<string, unknown> =>
      JSON.parse(atob(value.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    const before = decode(token);
    const current = decode(session.token);
    return typeof before.sid === 'string' && before.sid === current.sid
      && before.sub === current.sub && before.merchantId === current.merchantId;
  } catch {
    return false;
  }
}

export function commitStaffRefresh(snapshot: string, token: string, refreshToken: string): boolean {
  if (localStorage.getItem(STAFF_STORAGE_KEY) !== snapshot) return false;
  const current = readStaffSession();
  if (!current) return false;
  writeStaffSession({ ...current, token, refreshToken }, current.expiresAt);
  window.dispatchEvent(new Event(STAFF_SESSION_EVENT));
  return true;
}

export function writeStaffSession(value: StaffSessionSnapshot & { role?: string; merchants?: unknown[] }, expiresAt = Date.now() + 8 * 60 * 60 * 1000): void {
  localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify({
    token: value.token, refreshToken: value.refreshToken, staffId: value.staffId,
    merchantId: value.merchantId, role: value.role, merchants: value.merchants,
    expiresAt,
  }));
}
