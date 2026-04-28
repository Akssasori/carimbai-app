import type { CustomerCardsResponse, QRTokenResponse, StampRequest, StampResponse, CustomerLoginRequest, CustomerLoginResponse, StaffLoginResponse, RedeemRequest, RedeemResponse, RedeemQrTokenResponse, RedeemQrRequest, ProgramItem, EnrollCardResponse, SocialProvider } from '../types';

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

    return response.json();
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

  async getCustomerCards(customerId: number): Promise<CustomerCardsResponse> {
    const response = await fetch(`${this.baseUrl}/cards/customer/${customerId}`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar cartões: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getCardQR(cardId: number): Promise<QRTokenResponse> {
    const response = await fetch(`${this.baseUrl}/qr/${cardId}`);
    
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

  async getRedeemQR(cardId: number): Promise<RedeemQrTokenResponse> {
    const response = await fetch(`${this.baseUrl}/cards/${cardId}/redeem-qr`);

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