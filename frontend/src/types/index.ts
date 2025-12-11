export interface Channel {
  id: string;
  name: string;
  url: string;
  logo?: string;
  group_title: string;
  status: 'unknown' | 'online' | 'offline' | 'testing';
  tvg_id?: string;
  tvg_name?: string;
  response_time?: number;
  last_tested?: number;
}

export interface ImportHistory {
  id: string;
  name: string;
  url?: string;
  type: 'url' | 'file' | 'text';
  channel_count: number;
  imported_at: number;
}

export type StatusFilter = 'all' | 'online' | 'offline' | 'unknown';

export interface Stats {
  total: number;
  online: number;
  offline: number;
  unknown: number;
}
