const API_BASE_URL = 'http://localhost:3001/api';

export interface WhatsAppStatus {
  status: 'disconnected' | 'qr_code' | 'connected' | 'error';
  isConnected: boolean;
  qrCode?: string;
  groupId?: string;
}

export interface GroupInfo {
  id: string;
  name: string;
  participants: number;
  description?: string;
}

export interface QueueItem {
  id: string;
  message: string;
  imageUrl?: string;
  productName: string;
  status: 'pending' | 'sending' | 'sent' | 'error';
  createdAt: string;
  sentAt?: string;
  error?: string;
}

export interface QueueStatus {
  isProcessing: boolean;
  totalItems: number;
  pendingItems: number;
  sentItems: number;
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || 'Request failed');
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Servidor não está rodando. Execute: npm run dev:server');
      }
      throw error;
    }
  }

  // WhatsApp methods
  async getWhatsAppStatus(): Promise<WhatsAppStatus> {
    const response = await this.request<{ success: boolean } & WhatsAppStatus>('/whatsapp/status');
    return response;
  }

  async initializeWhatsApp(): Promise<void> {
    await this.request('/whatsapp/initialize', { method: 'POST' });
  }

  async connectToGroup(inviteLink: string): Promise<GroupInfo> {
    const response = await this.request<{ success: boolean; group: GroupInfo }>('/whatsapp/connect-group', {
      method: 'POST',
      body: JSON.stringify({ inviteLink }),
    });
    return response.group;
  }

  async getGroupInfo(): Promise<GroupInfo | null> {
    const response = await this.request<{ success: boolean; group: GroupInfo | null }>('/whatsapp/group-info');
    return response.group;
  }

  async sendMessage(message: string, imageUrl?: string): Promise<void> {
    await this.request('/whatsapp/send-message', {
      method: 'POST',
      body: JSON.stringify({ message, imageUrl }),
    });
  }

  async disconnectWhatsApp(): Promise<void> {
    await this.request('/whatsapp/disconnect', { method: 'POST' });
  }

  // Queue methods
  async addToQueue(message: string, imageUrl: string | undefined, productName: string): Promise<QueueItem> {
    const response = await this.request<{ success: boolean; item: QueueItem }>('/queue/add', {
      method: 'POST',
      body: JSON.stringify({ message, imageUrl, productName }),
    });
    return response.item;
  }

  async getQueue(): Promise<QueueItem[]> {
    const response = await this.request<{ success: boolean; queue: QueueItem[] }>('/queue');
    return response.queue;
  }

  async removeFromQueue(id: string): Promise<void> {
    await this.request(`/queue/${id}`, { method: 'DELETE' });
  }

  async startQueue(interval: number): Promise<void> {
    await this.request('/queue/start', {
      method: 'POST',
      body: JSON.stringify({ interval }),
    });
  }

  async stopQueue(): Promise<void> {
    await this.request('/queue/stop', { method: 'POST' });
  }

  async getQueueStatus(): Promise<QueueStatus> {
    const response = await this.request<{ success: boolean } & QueueStatus>('/queue/status');
    return response;
  }
}

export const apiService = new ApiService();