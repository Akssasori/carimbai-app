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
  created: boolean;
  token: string;
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
  token: string;
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

export interface DashboardMetrics {
  stampsToday: number;
  rewardsToday: number;
  totalCustomers: number;
  generatedAt: string;
}

export interface RecentStampItem {
  id: number;
  cardId: number;
  customerId: number;
  customerName: string | null;
  programName: string;
  stampsCount: number;
  stampsNeeded: number;
  cashierEmail: string | null;
  locationName: string | null;
  whenAt: string;
}

export interface RecentRewardItem {
  id: number;
  cardId: number;
  customerId: number;
  customerName: string | null;
  programName: string;
  rewardName: string;
  cashierEmail: string | null;
  locationName: string | null;
  issuedAt: string;
}

export interface RecentStampsResponse {
  items: RecentStampItem[];
}

export interface RecentRewardsResponse {
  items: RecentRewardItem[];
}

// ─── Admin (gestão de programas / staff / locations) ───────────────────

export type StaffRole = 'ADMIN' | 'CASHIER';

export interface AdminProgramItem {
  id: number;
  merchantId: number;
  name: string;
  description: string | null;
  ruleTotalStamps: number;
  rewardName: string;
  expirationDays: number | null;
  active: boolean;
  startAt: string | null;
  endAt: string | null;
  category: string | null;
  terms: string | null;
  imageUrl: string | null;
  sortOrder: number;
}

export interface CreateProgramRequest {
  name: string;
  ruleTotalStamps?: number;
  rewardName?: string;
  expirationDays?: number | null;
  description?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  category?: string | null;
  terms?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
}

export interface UpdateProgramRequest {
  name?: string;
  ruleTotalStamps?: number;
  rewardName?: string;
  expirationDays?: number | null;
  description?: string | null;
  active?: boolean;
  startAt?: string | null;
  endAt?: string | null;
  category?: string | null;
  terms?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
}

export interface LocationFlags {
  requirePinOnRedeem: boolean;
  enableScanA: boolean;
  enableScanB: boolean;
}

export interface LocationItem {
  id: number;
  merchantId: number;
  name: string;
  address: string | null;
  active: boolean;
  flags: LocationFlags;
}

export interface CreateLocationRequest {
  merchantId: number;
  name: string;
  address?: string | null;
}

export interface UpdateLocationRequest {
  name?: string;
  address?: string | null;
  active?: boolean;
  flags?: LocationFlags;
}

export interface StaffItem {
  staffId: number;
  email: string;
  role: StaffRole;
  active: boolean;
  isDefault: boolean;
  createdAt: string;
}

export interface CreateStaffRequest {
  merchantId: number;
  email: string;
  password: string;
  role: StaffRole;
}

export interface CreateStaffResponse {
  id: number;
  email: string;
  merchantId: number;
  role: StaffRole;
}

export interface UpdateStaffMerchantRequest {
  role?: StaffRole;
  active?: boolean;
}
