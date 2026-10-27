import type { CustomerEnrollmentQr } from '../types';

export function parseEnrollmentQr(text: string): CustomerEnrollmentQr {
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== 'object') throw new Error('QR invalido.');
  const qr = value as CustomerEnrollmentQr;
  if (qr.type !== 'CUSTOMER_ID' || !Number.isSafeInteger(qr.customerId) || qr.customerId <= 0
    || typeof qr.nonce !== 'string' || !/^[0-9a-f-]{36}$/i.test(qr.nonce)
    || !Number.isSafeInteger(qr.exp) || qr.exp <= Date.now() / 1000
    || typeof qr.sig !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(qr.sig)) {
    throw new Error('QR invalido ou expirado. Gere um novo QR no aplicativo do cliente.');
  }
  return qr;
}
