import type {
  CustomerCardsResponse, QRTokenResponse, StampRequest, StampResponse,
  CustomerLoginRequest, CustomerLoginResponse, StaffLoginResponse,
  RedeemRequest, RedeemResponse, RedeemQrTokenResponse, RedeemQrRequest,
  ProgramItem, EnrollCardResponse, SocialProvider,
  DashboardMetrics, RecentStampItem, RecentRewardItem,
  RecentStampsResponse, RecentRewardsResponse,
  AdminProgramItem, CreateProgramRequest, UpdateProgramRequest,
  LocationItem, CreateLocationRequest, UpdateLocationRequest,
  StaffItem, CreateStaffRequest, CreateStaffResponse, UpdateStaffMerchantRequest,
  RefreshTokenResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||'http://localhost:1234/api';

const STAFF_STORAGE_KEY = 'carimbai_staff_session';
const CUSTOMER_STORAGE_KEY = 'carimbai_customer';

type SessionKind = 'staff' | 'customer';

interface StaffSessionLite {
  token: string;
  refreshToken?: string;
}

// ─── Refresh token: single-flight (evita N requests 401 disparando N refreshes) ──

let inflightRefresh: Promise<string | null> | null = null;

async function tryStaffRefresh(): Promise<string | null> {
  if (inflightRefresh) return inflightRefresh;
  inflightRefresh = doStaffRefresh();
  try {
    return await inflightRefresh;
  } finally {
    inflightRefresh = null;
  }
}

async function doStaffRefresh(): Promise<string | null> {
  const raw = localStorage.getItem(STAFF_STORAGE_KEY);
  if (!raw) return null;

  let session: StaffSessionLite | null = null;
  try {
    session = JSON.parse(raw) as StaffSessionLite;
  } catch {
    return null;
  }
  if (!session?.refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });
    if (!res.ok) return null;
    const data: RefreshTokenResponse = await res.json();
    const updated = { ...session, token: data.token, refreshToken: data.refreshToken };
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(updated));
    return data.token;
  } catch {
    return null;
  }
}

function clearSessionAndRedirect(kind: SessionKind): never {
  if (kind === 'staff') {
    localStorage.removeItem(STAFF_STORAGE_KEY);
    window.location.replace('/staff');
  } else {
    localStorage.removeItem(CUSTOMER_STORAGE_KEY);
    window.location.replace('/');
  }
  throw new Error('Sessão expirada. Faça login novamente.');
}

/**
 * Faz fetch com tratamento automatico de 401:
 * - Para 'staff': tenta refresh transparente. Se sucesso, repete a request com novo access token.
 *   Se refresh falha, limpa localStorage e redireciona para /staff.
 * - Para 'customer': nao ha refresh hoje; 401 limpa localStorage e redireciona para /.
 * - Sem `kind`: comportamento de fetch puro, sem tratamento de 401 (uso em endpoints publicos).
 * - 403 NUNCA dispara redirect (ownership violation legitimo). Caller trata como erro normal.
 */
async function authedFetch(
  url: RequestInfo,
  init?: RequestInit,
  kind?: SessionKind,
): Promise<Response> {
  let response = await fetch(url, init);

  if (!kind) return response;

  if (response.status === 401 && kind === 'staff') {
    const newToken = await tryStaffRefresh();
    if (newToken && init) {
      const newHeaders = new Headers(init.headers);
      newHeaders.set('Authorization', `Bearer ${newToken}`);
      response = await fetch(url, { ...init, headers: newHeaders });
    }
  }

  if (response.status === 401) {
    clearSessionAndRedirect(kind);
  }

  return response;
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
    const response = await authedFetch(`${this.baseUrl}/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(redeemRequest),
    }, 'staff');

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao resgatar recompensa: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Inicia fluxo de reset de senha do staff. Sempre retorna 204 (mesmo se email
   * nao existe — anti-enumeration). Front mostra mensagem generica.
   */
  async forgotPassword(email: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro ao solicitar reset: ${response.status} - ${text}`);
    }
  }

  /**
   * Consome o token do link e troca a senha. Em 401 (token invalido/expirado/usado),
   * caller mostra mensagem clara para o usuario pedir novo link.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ token, newPassword }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${response.status}: ${text}`);
    }
  }

  /**
   * Logout server-side: revoga o refresh token. Front deve descartar a sessao em seguida.
   * Idempotente; ignora falhas (importante para nao bloquear logout local em rede flaky).
   */
  async logoutStaff(refreshToken: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // logout deve sempre concluir mesmo se a rede falhar
    }
  }

  async loginStaff(email: string, password: string, merchantId?: number): Promise<StaffLoginResponse> {
    const body: Record<string, unknown> = { email, password };
    if (merchantId != null) {
      body.merchantId = merchantId;
    }

    const response = await authedFetch(`${this.baseUrl}/auth/login`, {
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
    const response = await authedFetch(`${this.baseUrl}/auth/switch-merchant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ merchantId }),
    }, 'staff');

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro ao trocar merchant: ${response.status} - ${text}`);
    }

    return response.json();
  }

  async getMerchantPrograms(merchantId: number): Promise<ProgramItem[]> {
    const response = await authedFetch(`${this.baseUrl}/merchants/${merchantId}/programs`);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro ao buscar programas: ${response.status} - ${text}`);
    }

    return response.json();
  }

  async enrollCustomer(programId: number, customerId: number, token: string): Promise<EnrollCardResponse> {
    const response = await authedFetch(`${this.baseUrl}/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ programId, customerId }),
    }, 'staff');

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro ao inscrever cliente: ${response.status} - ${text}`);
    }

    const data = await response.json();
    return { ...data, created: response.status === 201 };
  }

  async socialLoginCustomer(provider: SocialProvider, token: string): Promise<CustomerLoginResponse> {
    const response = await authedFetch(`${this.baseUrl}/customers/social-login`, {
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
    const response = await authedFetch(`${this.baseUrl}/customers/login-or-register`, {
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
    const response = await authedFetch(`${this.baseUrl}/cards/customer/${customerId}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }, 'customer');

    if (!response.ok) {
      throw new Error(`Erro ao buscar cartões: ${response.statusText}`);
    }

    return response.json();
  }

  async getCardQR(cardId: number, token: string): Promise<QRTokenResponse> {
    const response = await authedFetch(`${this.baseUrl}/qr/${cardId}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }, 'customer');

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

    const response = await authedFetch(`${this.baseUrl}/stamp`, {
      method: 'POST',
      headers,
      body: JSON.stringify(stampRequest),
    }, 'staff');

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao aplicar carimbo: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async getRedeemQR(cardId: number, token: string): Promise<RedeemQrTokenResponse> {
    const response = await authedFetch(`${this.baseUrl}/cards/${cardId}/redeem-qr`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }, 'customer');

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

    const response = await authedFetch(`${this.baseUrl}/redeem`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    }, 'staff');

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao resgatar recompensa: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async getStaffDashboardMetrics(token: string): Promise<DashboardMetrics> {
    const response = await authedFetch(`${this.baseUrl}/staff/dashboard/metrics`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }, 'staff');

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro ao buscar métricas: ${response.status} - ${text}`);
    }

    return response.json();
  }

  async getRecentStamps(token: string, limit = 10): Promise<RecentStampItem[]> {
    const response = await authedFetch(`${this.baseUrl}/staff/stamps/recent?limit=${limit}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }, 'staff');

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro ao buscar carimbos recentes: ${response.status} - ${text}`);
    }

    const data: RecentStampsResponse = await response.json();
    return data.items;
  }

  async getRecentRewards(token: string, limit = 10): Promise<RecentRewardItem[]> {
    const response = await authedFetch(`${this.baseUrl}/staff/rewards/recent?limit=${limit}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }, 'staff');

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro ao buscar prêmios recentes: ${response.status} - ${text}`);
    }

    const data: RecentRewardsResponse = await response.json();
    return data.items;
  }

  // ─── Admin: programs ──────────────────────────────────────────────

  async getAdminPrograms(merchantId: number, token: string): Promise<AdminProgramItem[]> {
    const response = await authedFetch(`${this.baseUrl}/merchants/${merchantId}/admin/programs`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }, 'staff');

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro ao buscar programas: ${response.status} - ${text}`);
    }
    return response.json();
  }

  async createProgram(
    merchantId: number,
    request: CreateProgramRequest,
    token: string,
  ): Promise<AdminProgramItem> {
    const response = await authedFetch(`${this.baseUrl}/merchants/${merchantId}/programs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    }, 'staff');

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro ao criar programa: ${response.status} - ${text}`);
    }
    return response.json();
  }

  async updateProgram(
    merchantId: number,
    programId: number,
    request: UpdateProgramRequest,
    token: string,
  ): Promise<AdminProgramItem> {
    const response = await authedFetch(`${this.baseUrl}/merchants/${merchantId}/programs/${programId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    }, 'staff');

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro ao atualizar programa: ${response.status} - ${text}`);
    }
    return response.json();
  }

  // ─── Admin: locations ─────────────────────────────────────────────

  async getMerchantLocations(merchantId: number, token: string): Promise<LocationItem[]> {
    const response = await authedFetch(`${this.baseUrl}/merchants/${merchantId}/locations`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }, 'staff');

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro ao buscar locations: ${response.status} - ${text}`);
    }
    return response.json();
  }

  async createLocation(
    merchantId: number,
    request: CreateLocationRequest,
    token: string,
  ): Promise<{ merchantId: number; name: string; address: string | null }> {
    const response = await authedFetch(`${this.baseUrl}/merchants/${merchantId}/locations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    }, 'staff');

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro ao criar location: ${response.status} - ${text}`);
    }
    return response.json();
  }

  async updateLocation(
    merchantId: number,
    locationId: number,
    request: UpdateLocationRequest,
    token: string,
  ): Promise<LocationItem> {
    const response = await authedFetch(`${this.baseUrl}/merchants/${merchantId}/locations/${locationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    }, 'staff');

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro ao atualizar location: ${response.status} - ${text}`);
    }
    return response.json();
  }

  // ─── Admin: staff ─────────────────────────────────────────────────

  async getMerchantStaff(merchantId: number, token: string): Promise<StaffItem[]> {
    const response = await authedFetch(`${this.baseUrl}/merchants/${merchantId}/staff-users`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }, 'staff');

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro ao buscar staff: ${response.status} - ${text}`);
    }
    return response.json();
  }

  async createStaff(request: CreateStaffRequest, token: string): Promise<CreateStaffResponse> {
    const response = await authedFetch(`${this.baseUrl}/staff-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    }, 'staff');

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro ao criar staff: ${response.status} - ${text}`);
    }
    return response.json();
  }

  async updateStaffInMerchant(
    merchantId: number,
    staffId: number,
    request: UpdateStaffMerchantRequest,
    token: string,
  ): Promise<StaffItem> {
    const response = await authedFetch(`${this.baseUrl}/merchants/${merchantId}/staff-users/${staffId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    }, 'staff');

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro ao atualizar staff: ${response.status} - ${text}`);
    }
    return response.json();
  }

  async setStaffPin(staffId: number, pin: string, token: string): Promise<void> {
    const response = await authedFetch(`${this.baseUrl}/admin/staff-users/${staffId}/pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ pin }),
    }, 'staff');

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro ao definir PIN: ${response.status} - ${text}`);
    }
  }

  async getVapidPublicKey(): Promise<{ publicKey: string }> {
    const response = await authedFetch(`${this.baseUrl}/notifications/vapid-public-key`);
    if (!response.ok) {
      throw new Error('Erro ao buscar VAPID key');
    }
    return response.json();
  }

  async subscribePush(customerId: number, subscription: PushSubscription, token: string): Promise<void> {
    const json = subscription.toJSON();
    const response = await authedFetch(`${this.baseUrl}/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        customerId,  // ignorado pelo backend (vem do JWT); enviado por compatibilidade
        endpoint: json.endpoint,
        keys: {
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
        },
      }),
    }, 'customer');
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erro ao inscrever push: ${response.status} - ${text}`);
    }
  }

}

export const apiService = new ApiService();