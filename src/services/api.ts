import type { CustomerCardsResponse, QRTokenResponse, StampRequest, StampResponse, CustomerLoginRequest, CustomerLoginResponse, StaffLoginResponse, RedeemRequest, RedeemResponse, RedeemQrTokenResponse, RedeemQrRequest, ProgramItem, EnrollCardResponse, SocialProvider, DashboardMetrics, RecentStampItem, RecentRewardItem, RecentStampsResponse, RecentRewardsResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||'http://localhost:1234/api';

const STAFF_STORAGE_KEY = 'carimbai_staff_session';
const CUSTOMER_STORAGE_KEY = 'carimbai_customer';

type SessionKind = 'staff' | 'customer';

/**
 * Em 401, limpa a sessao correspondente do localStorage e redireciona para o login.
 * Lanca uma Error para abortar o fluxo no chamador. Para 403, nao redireciona porque
 * 403 e um ownership violation legitimo (usuario logado, mas sem permissao naquele recurso).
 */
function handleUnauthorized(response: Response, kind: SessionKind): void {
  if (response.status !== 401) return;

  if (kind === 'staff') {
    localStorage.removeItem(STAFF_STORAGE_KEY);
    window.location.replace('/staff');
  } else {
    localStorage.removeItem(CUSTOMER_STORAGE_KEY);
    window.location.replace('/');
  }
  throw new Error('Sessão expirada. Faça login novamente.');
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async redeem(
    redeemRequest: RedeemRequest,
    token: string
  ): Promise<RedeemResponse> {
    const response = await fetch(`${this.baseUrl}/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(redeemRequest),
    });

    handleUnauthorized(response, 'staff');

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao resgatar recompensa: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async loginStaff(email: string, password: string, merchantId?: number): Promise<StaffLoginResponse> {
    const body: Record<string, unknown> = { email, password };
    if (merchantId != null) {
      body.merchantId = merchantId;
    }

    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro ao fazer login do staff: ${response.status} - ${text}`);
    }

    return response.json();
  }

  async switchMerchant(merchantId: number, token: string): Promise<StaffLoginResponse> {
    const response = await fetch(`${this.baseUrl}/auth/switch-merchant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ merchantId }),
    });

    handleUnauthorized(response, 'staff');

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro ao trocar merchant: ${response.status} - ${text}`);
    }

    return response.json();
  }

  async getMerchantPrograms(merchantId: number): Promise<ProgramItem[]> {
    const response = await fetch(`${this.baseUrl}/merchants/${merchantId}/programs`);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro ao buscar programas: ${response.status} - ${text}`);
    }

    return response.json();
  }

  async enrollCustomer(programId: number, customerId: number, token: string): Promise<EnrollCardResponse> {
    const response = await fetch(`${this.baseUrl}/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ programId, customerId }),
    });

    handleUnauthorized(response, 'staff');

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro ao inscrever cliente: ${response.status} - ${text}`);
    }

    const data = await response.json();
    return { ...data, created: response.status === 201 };
  }

  async socialLoginCustomer(provider: SocialProvider, token: string): Promise<CustomerLoginResponse> {
    const response = await fetch(`${this.baseUrl}/customers/social-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ provider, token }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao autenticar via ${provider}: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // 🔹 LOGIN LIGHT DO CLIENTE
  async loginOrRegisterCustomer(payload: CustomerLoginRequest): Promise<CustomerLoginResponse> {
    const response = await fetch(`${this.baseUrl}/customers/login-or-register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao autenticar cliente: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async getCustomerCards(customerId: number, token: string): Promise<CustomerCardsResponse> {
    const response = await fetch(`${this.baseUrl}/cards/customer/${customerId}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    handleUnauthorized(response, 'customer');

    if (!response.ok) {
      throw new Error(`Erro ao buscar cartões: ${response.statusText}`);
    }

    return response.json();
  }

  async getCardQR(cardId: number, token: string): Promise<QRTokenResponse> {
    const response = await fetch(`${this.baseUrl}/qr/${cardId}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    handleUnauthorized(response, 'customer');

    if (!response.ok) {
      throw new Error(`Erro ao gerar QR Code: ${response.statusText}`);
    }

    return response.json();
  }

  async applyStamp(
    stampRequest: StampRequest,
    idempotencyKey: string,
    token?: string,
    locationId?: number
  ): Promise<StampResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
      'Accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (locationId != null) {
    headers['X-Location-Id'] = String(locationId);
    }

    const response = await fetch(`${this.baseUrl}/stamp`, {
      method: 'POST',
      headers,
      body: JSON.stringify(stampRequest),
    });

    handleUnauthorized(response, 'staff');

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao aplicar carimbo: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async getRedeemQR(cardId: number, token: string): Promise<RedeemQrTokenResponse> {
    const response = await fetch(`${this.baseUrl}/cards/${cardId}/redeem-qr`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    handleUnauthorized(response, 'customer');

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao gerar QR de resgate: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async redeemWithQr(
    request: RedeemQrRequest,
    token: string,
    cashierPin?: string
  ): Promise<RedeemResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    if (cashierPin) {
      headers['X-Cashier-Pin'] = cashierPin;
    }

    const response = await fetch(`${this.baseUrl}/redeem`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    handleUnauthorized(response, 'staff');

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao resgatar recompensa: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async getStaffDashboardMetrics(token: string): Promise<DashboardMetrics> {
    const response = await fetch(`${this.baseUrl}/staff/dashboard/metrics`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    handleUnauthorized(response, 'staff');

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro ao buscar métricas: ${response.status} - ${text}`);
    }

    return response.json();
  }

  async getRecentStamps(token: string, limit = 10): Promise<RecentStampItem[]> {
    const response = await fetch(`${this.baseUrl}/staff/stamps/recent?limit=${limit}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    handleUnauthorized(response, 'staff');

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro ao buscar carimbos recentes: ${response.status} - ${text}`);
    }

    const data: RecentStampsResponse = await response.json();
    return data.items;
  }

  async getRecentRewards(token: string, limit = 10): Promise<RecentRewardItem[]> {
    const response = await fetch(`${this.baseUrl}/staff/rewards/recent?limit=${limit}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    handleUnauthorized(response, 'staff');

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro ao buscar prêmios recentes: ${response.status} - ${text}`);
    }

    const data: RecentRewardsResponse = await response.json();
    return data.items;
  }

  async getVapidPublicKey(): Promise<{ publicKey: string }> {
    const response = await fetch(`${this.baseUrl}/notifications/vapid-public-key`);
    if (!response.ok) {
      throw new Error('Erro ao buscar VAPID key');
    }
    return response.json();
  }

  async subscribePush(customerId: number, subscription: PushSubscription): Promise<void> {
    const json = subscription.toJSON();
    const response = await fetch(`${this.baseUrl}/notifications/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId,
        endpoint: json.endpoint,
        keys: {
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
        },
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro ao inscrever push: ${response.status} - ${text}`);
    }
  }

}

export const apiService = new ApiService();