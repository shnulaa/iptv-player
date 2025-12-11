import axios from 'axios';
import { Channel, ImportHistory, Stats } from '../types';

// 自动检测API地址
const getApiBaseUrl = () => {
  // 开发环境使用代理
  if (process.env.NODE_ENV === 'development') {
    return '';
  }
  // 生产环境使用同源
  return '';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
});

// 频道相关API
export const channelApi = {
  getAll: async (params?: { query?: string; group?: string; status?: string }) => {
    const res = await api.get<{ success: boolean; data: Channel[] }>('/api/channels', { params });
    return res.data.data;
  },
  
  getStats: async () => {
    const res = await api.get<{ success: boolean; data: Stats }>('/api/channels/stats');
    return res.data.data;
  },
  
  getGroups: async () => {
    const res = await api.get<{ success: boolean; data: string[] }>('/api/channels/groups');
    return res.data.data;
  },
  
  add: async (channel: Partial<Channel>) => {
    const res = await api.post<{ success: boolean; data: Channel }>('/api/channels', channel);
    return res.data.data;
  },
  
  import: async (channels: Partial<Channel>[]) => {
    const res = await api.post<{ success: boolean; data: Channel[]; count: number }>('/api/channels/import', { channels });
    return res.data;
  },
  
  update: async (id: string, updates: Partial<Channel>) => {
    const res = await api.put<{ success: boolean; data: Channel }>(`/api/channels/${id}`, updates);
    return res.data.data;
  },
  
  delete: async (id: string) => {
    await api.delete(`/api/channels/${id}`);
  },
  
  deleteAll: async () => {
    await api.delete('/api/channels');
  },
  
  test: async (id: string) => {
    const res = await api.post<{ success: boolean; data: { success: boolean; status: string; responseTime?: number } }>(`/api/channels/${id}/test`);
    return res.data.data;
  },
  
  testBatch: async (channelIds: string[]) => {
    const res = await api.post<{ success: boolean; data: any[] }>('/api/channels/test-batch', { channelIds });
    return res.data.data;
  },
};

// 代理相关API
export const proxyApi = {
  getM3U: async (url: string) => {
    const res = await api.get<string>('/api/proxy/m3u', { params: { url } });
    return res.data;
  },
  
  getHlsUrl: (url: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/proxy/hls?url=${encodeURIComponent(url)}`;
  },
};

// 历史记录API
export const historyApi = {
  getAll: async () => {
    const res = await api.get<{ success: boolean; data: ImportHistory[] }>('/api/history');
    return res.data.data;
  },
  
  add: async (history: Partial<ImportHistory>) => {
    const res = await api.post<{ success: boolean; data: ImportHistory }>('/api/history', history);
    return res.data.data;
  },
  
  delete: async (id: string) => {
    await api.delete(`/api/history/${id}`);
  },
  
  deleteAll: async () => {
    await api.delete('/api/history');
  },
};

export default api;
