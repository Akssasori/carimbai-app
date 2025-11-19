import type { CustomerCardsResponse, QRTokenResponse } from '../types';

const API_BASE_URL = 'http://localhost:1234/api';

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
}

export const apiService = new ApiService();