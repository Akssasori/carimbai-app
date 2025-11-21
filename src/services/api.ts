import type { CustomerCardsResponse, QRTokenResponse, StampRequest, StampResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||'http://localhost:1234/api';

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async getCustomerCards(customerId: number): Promise<CustomerCardsResponse> {
    const response = await fetch(`${this.baseUrl}/cards/customer/${customerId}`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar cartões: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getCardQR(cardId: number): Promise<QRTokenResponse> {
    const response = await fetch(`${this.baseUrl}/cards/${cardId}/qr`);
    
    if (!response.ok) {
      throw new Error(`Erro ao gerar QR Code: ${response.statusText}`);
    }
    
    return response.json();
  }

  async applyStamp(stampRequest: StampRequest, idempotencyKey: string): Promise<StampResponse> {
    const response = await fetch(`${this.baseUrl}/stamp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
        'Accept': 'application/json',
      },
      body: JSON.stringify(stampRequest),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao aplicar carimbo: ${response.status} - ${errorText}`);
    }
    
    return response.json();
  }
}

export const apiService = new ApiService();