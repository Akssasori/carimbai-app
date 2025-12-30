export interface Card {
  cardId: number;
  programId: number;
  programName: string;
  merchantName: string;
  rewardName: string;
  stampsCount: number;
  stampsNeeded: number;
  status: 'ACTIVE' | 'INACTIVE' | 'REDEEMED';
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
  created: boolean;
}

export interface CustomerLoginRequest {
  name?: string;
  email?: string;
  phone?: string;
  providerId?: string;
}

export interface CustomerLoginResponse {
  customerId: number;
  name?: string;
  email?: string;
  phone?: string;
  providerId?: string;
  created: boolean;
}

export interface StaffLoginResponse {
  token: string;
  staffId: number;
  role: 'ADMIN' | 'CASHIER';
  merchantId?: number;
}

export interface RedeemRequest {
  cardId: number;
  locationId?: number;
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