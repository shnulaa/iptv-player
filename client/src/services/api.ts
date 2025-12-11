import axios from 'axios';
import { Channel, ImportHistory, Stats } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// 频道API
export const channelApi = {
  getAll: async (params?: { search?: string; group?: string; status?: string }) => {
    const { data } = await api.get<{ success: boolean; data: Channel[] }>('/channels', { params });
    return data.data;
  },

  getStats: async (): Promise<Stats> => {
    const { data } = await api.get<{ success: boolean; data: Stats }>('/channels/stats');
    return data.data;
  },

  getGroups: async (): Promise<string[]> => {
    const { data } = await api.get<{ success: boolean; data: string[] }>('/channels/groups');
    return data.data;
  },

  create: async (channel: Partial<Channel>) => {
    const { data } = await api.post<{ success: boolean; data: Channel }>('/channels', channel);
    return data.data;
  },

  update: async (id: string, channel: Partial<Channel>) => {
    const { data } = await api.put<{ success: boolean; data: Channel }>(`/channels/${id}`, channel);
    return data.data;
  },

  updateStatus: async (id: string, status: Channel['status']) => {
    await api.patch(`/channels/${id}/status`, { status });
  },

  delete: async (id: string) => {
    await api.delete(`/channels/${id}`);
  },

  deleteAll: async () => {
    await api.delete('/channels');
  },
};

// M3U API
export const m3uApi = {
  loadFromUrl: async (url: string) => {
    const { data } = await api.post<{ success: boolean; data: { count: number; groups: string[] } }>('/m3u/url', { url });
    return data.data;
  },

  loadFromFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<{ success: boolean; data: { count: number; groups: string[] } }>('/m3u/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  loadFromText: async (content: string) => {
    const { data } = await api.post<{ success: boolean; data: { count: number; groups: string[] } }>('/m3u/text', { content });
    return data.data;
  },

  getHistory: async (): Promise<ImportHistory[]> => {
    const { data } = await api.get<{ success: boolean; data: ImportHistory[] }>('/m3u/history');
    return data.data;
  },

  deleteHistory: async (id: string) => {
    await api.delete(`/m3u/history/${id}`);
  },

  clearHistory: async () => {
    await api.delete('/m3u/history');
  },
};

// 代理API
export const proxyApi = {
  getStreamUrl: (url: string) => {
    if (url.endsWith('.m3u8')) {
      return `/api/proxy/m3u8?url=${encodeURIComponent(url)}`;
    }
    return `/api/proxy/stream?url=${encodeURIComponent(url)}`;
  },

  testChannel: async (url: string): Promise<{ online: boolean; responseTime?: number }> => {
    const { data } = await api.get<{ success: boolean; data: { online: boolean; responseTime?: number } }>(
      `/proxy/test?url=${encodeURIComponent(url)}`
    );
    return data.data;
  },
};
