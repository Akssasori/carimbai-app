import type { CustomerCardsResponse, QRTokenResponse, StampRequest, StampResponse, CustomerLoginResponse, StaffLoginResponse, RedeemRequest, RedeemResponse, RedeemQrTokenResponse, RedeemQrRequest, ProgramItem, EnrollCardResponse, SocialProvider } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||'http://localhost:1234/api';

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

  /**
   * Logout — revoga o JWT no backend (FIX-11 / SEC-012). Idempotente: erros
   * são silenciados, o caller sempre limpa o estado local.
   */
  async logout(token?: string): Promise<void> {
    if (!token) return;
    try {
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // sem rede / 4xx: ainda assim removemos a sessão local.
    }
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

  async enrollCustomer(programId: number, customerId: number): Promise<EnrollCardResponse> {
    const response = await fetch(`${this.baseUrl}/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ programId, customerId }),
    });

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

  // FIX-02 Fase D — login-light removido do self-service do cliente; o endpoint
  // /customers/login-or-register agora exige staff (CASHIER/ADMIN). Onboarding
  // do cliente é exclusivamente via social-login (Google/Facebook).

  // Header de autenticação do cliente — Bearer do JWT emitido no social-login.
  private customerAuthHeaders(token?: string): Record<string, string> {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getCustomerCards(customerId: number, token?: string): Promise<CustomerCardsResponse> {
    const response = await fetch(`${this.baseUrl}/cards/customer/${customerId}`, {
      headers: this.customerAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar cartões: ${response.statusText}`);
    }

    return response.json();
  }

  async getCardQR(cardId: number, token?: string): Promise<QRTokenResponse> {
    const response = await fetch(`${this.baseUrl}/qr/${cardId}`, {
      headers: this.customerAuthHeaders(token),
    });

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

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao aplicar carimbo: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async getRedeemQR(cardId: number, token?: string): Promise<RedeemQrTokenResponse> {
    const response = await fetch(`${this.baseUrl}/cards/${cardId}/redeem-qr`, {
      headers: this.customerAuthHeaders(token),
    });

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

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao resgatar recompensa: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async getVapidPublicKey(): Promise<{ publicKey: string }> {
    const response = await fetch(`${this.baseUrl}/notifications/vapid-public-key`);
    if (!response.ok) {
      throw new Error('Erro ao buscar VAPID key');
    }
    return response.json();
  }

  async subscribePush(customerId: number, subscription: PushSubscription, token?: string): Promise<void> {
    const json = subscription.toJSON();
    const response = await fetch(`${this.baseUrl}/notifications/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.customerAuthHeaders(token) },
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