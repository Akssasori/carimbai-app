export interface Card {
  cardId: number;
  programId: number;
  programName: string;
  merchantName: string;
  rewardName: string;
  stampsCount: number;
  stampsNeeded: number;
  status: 'ACTIVE' | 'BLOCKED' | 'EXPIRED' | 'READY_TO_REDEEM';
  hasReward: boolean;
}

export interface CustomerCardsResponse {
  cards: Card[];
}

export interface QRTokenResponse {
  type: string;
  idRef: number;
  nonce: string;
  exp: number;
  sig: string;
}

export interface StampPayload {
  cardId: number;
  nonce: string;
  exp: number;
  sig: string;
}

export interface StampRequest {
  type: 'CUSTOMER_QR' | 'STORE_QR';
  payload: StampPayload;
}

export interface StampResponse {
  ok: boolean;
  cardId: number;
  stamps: number;
  needed: number;
  rewardIssued: boolean;
}

export interface CustomerData {
  customerId: number;
  name?: string;
  email?: string;
  phone?: string;
  providerId?: string;
  // JWT de cliente emitido no social-login (FIX-02 Fase D — onboarding é social-only).
  token?: string;
}

export interface CustomerLoginResponse {
  customerId: number;
  name?: string;
  email?: string;
  phone?: string;
  providerId?: string;
  // JWT de cliente emitido no social-login (FIX-02 Fase D — onboarding é social-only).
  token?: string;
}

export interface MerchantInfo {
  merchantId: number;
  merchantName: string;
  role: 'ADMIN' | 'CASHIER';
  isDefault: boolean;
}

export interface StaffLoginResponse {
  token: string;
  staffId: number;
  merchantId: number;
  role: 'ADMIN' | 'CASHIER';
  email: string;
  merchants: MerchantInfo[];
}

export interface SwitchMerchantRequest {
  merchantId: number;
}

export interface ProgramItem {
  id: number;
  name: string;
  description?: string;
  ruleTotalStamps: number;
  rewardName: string;
  category?: string;
  imageUrl?: string;
  startAt?: string;
  endAt?: string;
  sortOrder: number;
}

export interface RedeemRequest {
  cardId: number;
  locationId?: number;
}

export interface RedeemQrPayload {
  cardId: number;
  nonce: string;
  exp: number;
  sig: string;
}

export interface RedeemQrTokenResponse {
  type: string;
  cardId: number;
  nonce: string;
  exp: number;
  sig: string;
}

export interface RedeemQrRequest {
  cardId: number;
  locationId?: number;
  redeemQr: RedeemQrPayload;
}

export interface RedeemResponse {
  ok: boolean;
  rewardId: number | null;
  cardId: number | null;
  stampsAfter: number;
}

export interface QRCodeData {
  idRef: number;
  nonce: string;
  exp: number;
  sig: string;
}

export interface EnrollCardResponse {
  id: number;
  programId: number;
  customerId: number;
  stampsCount: number;
  status: string;
  created: boolean;
}

export type SocialProvider = 'GOOGLE' | 'FACEBOOK';

export interface SocialLoginRequest {
  provider: SocialProvider;
  token: string;
}
