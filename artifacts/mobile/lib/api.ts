import { auth } from './firebase';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.106:3000/api';

async function apiRequest<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (data: any) =>
    apiRequest<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getProfile: () => apiRequest('/auth/me'),
  updateProfile: (data: any) =>
    apiRequest('/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),
};

export const customerApi = {
  getProfile: (uid: string) => apiRequest(`/customers/${uid}`),
  updateProfile: (uid: string, data: any) =>
    apiRequest(`/customers/${uid}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const meterApi = {
  getStatus: (meterId: string) => apiRequest(`/meters/${meterId}/status`),
  getConsumption: (meterId: string, period?: string) =>
    apiRequest(`/meters/${meterId}/consumption${period ? `?period=${period}` : ''}`),
};

export const billApi = {
  getCurrent: () => apiRequest('/bills/current'),
  getHistory: () => apiRequest('/bills/history'),
  getAll: () => apiRequest('/bills'),
};

export const paymentApi = {
  create: (billId: string) =>
    apiRequest('/payments/create', {
      method: 'POST',
      body: JSON.stringify({ billId }),
    }),
  getHistory: () => apiRequest('/payments/history'),
};

export const valveApi = {
  getStatus: (meterId: string) => apiRequest(`/valve/status/${meterId}`),
  requestAction: (meterId: string, action: 'open' | 'close') =>
    apiRequest('/valve/request', {
      method: 'POST',
      body: JSON.stringify({ meterId, action }),
    }),
};

export const deviceApi = {
  setLed: (meterId: string, on: boolean) =>
    apiRequest('/led/request', {
      method: 'POST',
      body: JSON.stringify({ meterId, action: on ? 'on' : 'off' }),
    }),
  getLedState: (meterId: string) => apiRequest(`/led/status/${meterId}`),
};

export const notificationApi = {
  list: () => apiRequest('/notifications'),
  markRead: (id: string) =>
    apiRequest(`/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () =>
    apiRequest('/notifications/read-all', { method: 'POST' }),
};

export const complaintApi = {
  create: (data: any) =>
    apiRequest('/complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  list: () => apiRequest('/complaints'),
};

const api = {
  getBills: billApi.getAll,
  getCurrentBill: billApi.getCurrent,
  getBillHistory: billApi.getHistory,
  createPayment: paymentApi.create,
  getPaymentHistory: paymentApi.getHistory,
  getMeterStatus: meterApi.getStatus,
  getMeterConsumption: meterApi.getConsumption,
  getValveStatus: valveApi.getStatus,
  getNotifications: notificationApi.list,
  markNotificationRead: notificationApi.markRead,
  getProfile: authApi.getProfile,
};

export default api;
export { api };
