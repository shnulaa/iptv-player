export interface Channel {
  id: string;
  name: string;
  url: string;
  logo?: string;
  group_name: string;
  status: 'unknown' | 'online' | 'offline' | 'testing';
  tvg_id?: string;
  tvg_name?: string;
  created_at: number;
  updated_at: number;
}

export interface ImportHistory {
  id: string;
  name: string;
  url?: string;
  channel_count: number;
  type: 'url' | 'file' | 'text';
  created_at: number;
}

export type StatusFilter = 'all' | 'online' | 'offline' | 'unknown';

export interface Stats {
  total: number;
  online: number;
  offline: number;
  unknown: number;
}
