import React from 'react';
import { Search, Filter, X, Wifi, WifiOff, HelpCircle } from 'lucide-react';
import { Input } from './ui/Input';
import { StatusFilter, Stats } from '../types';

interface Props {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  groups: string[];
  selectedGroup: string;
  onGroupChange: (g: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (s: StatusFilter) => void;
  stats: Stats;
}

export const SearchFilter: React.FC<Props> = ({ searchQuery, onSearchChange, groups, selectedGroup, onGroupChange, statusFilter, onStatusFilterChange, stats }) => {
  const statusOptions: { value: StatusFilter; label: string; icon: React.ReactNode; count: number }[] = [
    { value: 'all', label: '全部', icon: null, count: stats.total },
    { value: 'online', label: '在线', icon: <Wifi size={14} className="text-green-400" />, count: stats.online },
    { value: 'offline', label: '离线', icon: <WifiOff size={14} className="text-red-400" />, count: stats.offline },
    { value: 'unknown', label: '未知', icon: <HelpCircle size={14} />, count: stats.unknown },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Input type="text" placeholder="搜索频道名称..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} icon={<Search size={18} />} />
          {searchQuery && <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"><X size={18} /></button>}
        </div>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Filter size={18} /></div>
          <select value={selectedGroup} onChange={(e) => onGroupChange(e.target.value)} className="input-field appearance-none pl-10 pr-10 py-2.5 rounded-xl text-white cursor-pointer min-w-[150px]">
            {groups.map((g) => <option key={g} value={g} className="bg-dark-200">{g}</option>)}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {statusOptions.map(({ value, label, icon, count }) => (
          <button key={value} onClick={() => onStatusFilterChange(value)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${statusFilter === value ? 'bg-primary-500/20 border border-primary-500/30 text-primary-400' : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'}`}>
            {icon}<span>{label}</span><span className="ml-1 px-1.5 py-0.5 rounded text-xs bg-white/10">{count}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
