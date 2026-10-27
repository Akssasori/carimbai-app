import assert from 'node:assert/strict';
import { test, beforeEach } from 'node:test';
import { STAFF_STORAGE_KEY, readStaffSession, belongsToSession, commitStaffRefresh } from '../src/services/staffSession.ts';
import { parseEnrollmentQr } from '../src/services/enrollment.ts';

const values = new Map();
globalThis.localStorage = {
  getItem: key => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: key => values.delete(key),
};
globalThis.window = new EventTarget();
const token = (sid = 'family-a', merchantId = 1) => `header.${btoa(JSON.stringify({ sid, sub: '7', merchantId }))}.signature`;
const session = () => ({ token: token(), refreshToken: 'refresh', staffId: 7, merchantId: 1, role: 'ADMIN', expiresAt: Date.now() + 60000 });
beforeEach(() => values.clear());

test('refresh cannot restore a session after logout', () => {
  const raw = JSON.stringify(session());
  values.set(STAFF_STORAGE_KEY, raw);
  values.delete(STAFF_STORAGE_KEY);
  assert.equal(commitStaffRefresh(raw, 'new', 'rotated'), false);
  assert.equal(readStaffSession(), null);
});

test('refresh cannot overwrite a new login or merchant switch', () => {
  const raw = JSON.stringify(session());
  values.set(STAFF_STORAGE_KEY, JSON.stringify({ ...session(), merchantId: 2 }));
  assert.equal(commitStaffRefresh(raw, 'new', 'rotated'), false);
  assert.equal(belongsToSession(token('other-family'), session()), false);
  assert.equal(belongsToSession(token('family-a', 2), session()), false);
});

test('refresh updates both credentials and retains staff context', () => {
  const raw = JSON.stringify(session());
  values.set(STAFF_STORAGE_KEY, raw);
  assert.equal(commitStaffRefresh(raw, token(), 'rotated'), true);
  assert.equal(readStaffSession().refreshToken, 'rotated');
  assert.equal(readStaffSession().role, 'ADMIN');
  assert.equal(belongsToSession(token(), readStaffSession()), true);
});

test('static IDs and expired enrollment QR codes are not accepted', () => {
  assert.throws(() => parseEnrollmentQr('{"type":"CUSTOMER_ID","customerId":1}'));
  const qr = { type: 'CUSTOMER_ID', customerId: 1, nonce: '11111111-1111-4111-8111-111111111111', exp: Math.floor(Date.now() / 1000) + 90, sig: 'a'.repeat(43) };
  assert.deepEqual(parseEnrollmentQr(JSON.stringify(qr)), qr);
  assert.throws(() => parseEnrollmentQr(JSON.stringify({ ...qr, exp: 1 })));
});
