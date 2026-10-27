import assert from 'node:assert/strict';
import { test, beforeEach } from 'node:test';
import { readCustomerSession, writeCustomerSession, clearCustomerSession, CUSTOMER_STORAGE_KEY } from '../src/services/customerSession.ts';
import { readStaffSession, writeStaffSession, commitStaffRefresh, STAFF_STORAGE_KEY } from '../src/services/staffSession.ts';
const persistent = new Map(), temporary = new Map();
const storage = map => ({ getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) });
globalThis.localStorage = storage(persistent);
globalThis.sessionStorage = storage(temporary);
globalThis.window = new EventTarget();
beforeEach(() => { persistent.clear(); temporary.clear(); });
test('customer profile and provider identity are not persisted', () => {
  writeCustomerSession({ customerId: 1, token: 'token', name: 'Name', email: 'private@example.test', providerId: 'provider:1' });
  assert.equal(persistent.size, 0);
  assert.deepEqual(JSON.parse(temporary.get(CUSTOMER_STORAGE_KEY)), { customerId: 1, token: 'token' });
  clearCustomerSession();
  assert.equal(readCustomerSession(), null);
});
test('old persistent customer profiles are removed instead of migrated', () => {
  persistent.set(CUSTOMER_STORAGE_KEY, JSON.stringify({ customerId: 1, name: 'Name', token: 'old' }));
  assert.equal(readCustomerSession(), null);
  assert.equal(persistent.size, 0);
});
test('expired and legacy staff sessions cannot be refreshed back into storage', () => {
  const expired = JSON.stringify({ token: 'token', staffId: 1, merchantId: 1, expiresAt: Date.now() - 1 });
  persistent.set(STAFF_STORAGE_KEY, expired);
  assert.equal(commitStaffRefresh(expired, 'new', 'refresh'), false);
  assert.equal(readStaffSession(), null);
});
test('staff storage strips identity fields and refresh does not extend local lifetime', () => {
  const expiresAt = Date.now() + 60000;
  writeStaffSession({ token: 'token', staffId: 1, merchantId: 1, email: 'private@example.test', providerId: 'secret', expiresAt }, expiresAt);
  const raw = persistent.get(STAFF_STORAGE_KEY);
  assert.equal(raw.includes('private@example.test'), false);
  assert.equal(commitStaffRefresh(raw, 'rotated', 'refresh'), true);
  assert.equal(readStaffSession().expiresAt, expiresAt);
});
