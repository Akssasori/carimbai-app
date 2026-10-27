export const CUSTOMER_STORAGE_KEY = 'carimbai_customer';
export interface CustomerSession { customerId: number; token: string }

export function readCustomerSession(): CustomerSession | null {
  // Legacy persistent profiles are not migrated back into browser storage.
  localStorage.removeItem(CUSTOMER_STORAGE_KEY);
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(CUSTOMER_STORAGE_KEY) ?? 'null');
    if (!value || typeof value !== 'object') return null;
    const item = value as Partial<CustomerSession>;
    return Number.isSafeInteger(item.customerId) && typeof item.token === 'string'
      ? { customerId: item.customerId!, token: item.token } : null;
  } catch { return null; }
}

export function writeCustomerSession(value: CustomerSession): void {
  localStorage.removeItem(CUSTOMER_STORAGE_KEY);
  sessionStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify({ customerId: value.customerId, token: value.token }));
}

export function clearCustomerSession(): void {
  localStorage.removeItem(CUSTOMER_STORAGE_KEY);
  sessionStorage.removeItem(CUSTOMER_STORAGE_KEY);
}
