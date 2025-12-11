import React from 'react';
import { Search, X, Wifi, WifiOff, HelpCircle } from 'lucide-react';
import { Input } from './ui/Input';
import { StatusFilter, Stats } from '../types';

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  status: StatusFilter;
  onStatusChange: (s: StatusFilter) => void;
  stats: Stats;
}

export const SearchFilter: React.FC<Props> = ({ query, onQueryChange, status, onStatusChange, stats }) => {
  const options: { value: StatusFilter; label: string; icon?: React.ReactNode; count: number }[] = [
    { value: 'all', label: '全部', count: stats.total },
    { value: 'online', label: '在线', icon: <Wifi size={14} className="text-green-400" />, count: stats.online },
    { value: 'offline', label: '离线', icon: <WifiOff size={14} className="text-red-400" />, count: stats.offline },
    { value: 'unknown', label: '未知', icon: <HelpCircle size={14} />, count: stats.unknown },
  ];

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input placeholder="搜索频道..." value={query} onChange={(e) => onQueryChange(e.target.value)} icon={<Search size={18} />} />
        {query && <button onClick={() => onQueryChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"><X size={18} /></button>}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map(({ value, label, icon, count }) => (
          <button key={value} onClick={() => onStatusChange(value)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${status === value ? 'bg-primary-500/20 border border-primary-500/30 text-primary-400' : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'}`}>
            {icon}<span>{label}</span><span className="ml-1 px-1.5 py-0.5 rounded text-xs bg-white/10">{count}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
