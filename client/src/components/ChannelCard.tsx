import React from 'react';
import { Play, Edit2, Trash2, Radio, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Channel } from '../types';

interface Props {
  channel: Channel;
  onPlay: (channel: Channel) => void;
  onEdit: (channel: Channel) => void;
  onDelete: (id: string) => void;
  onTest: (channel: Channel) => void;
}

export const ChannelCard: React.FC<Props> = ({ channel, onPlay, onEdit, onDelete, onTest }) => {
  const statusColors = { online: 'status-online', offline: 'status-offline', testing: 'status-testing', unknown: 'status-unknown' };
  const statusLabels = { online: '在线', offline: '离线', testing: '测试中', unknown: '未知' };

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="channel-card glass rounded-xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {channel.logo ? <img src={channel.logo} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <Radio className="text-primary-400" size={24} />}
          </div>
          <div className="flex-1 min-w-0"><h3 className="text-white font-medium truncate">{channel.name}</h3><p className="text-gray-500 text-sm truncate">{channel.group_name}</p></div>
          <div className="flex items-center gap-2"><div className={`status-indicator ${statusColors[channel.status]}`} /><span className="text-xs text-gray-400">{statusLabels[channel.status]}</span></div>
        </div>
        <p className="mt-3 text-xs text-gray-500 truncate font-mono bg-dark-300 rounded-lg px-3 py-2">{channel.url}</p>
      </div>
      <div className="flex border-t border-white/5">
        <button onClick={() => onPlay(channel)} className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors"><Play size={16} /><span className="text-sm">播放</span></button>
        <button onClick={() => onTest(channel)} disabled={channel.status === 'testing'} className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors disabled:opacity-50"><RefreshCw size={16} className={channel.status === 'testing' ? 'animate-spin' : ''} /><span className="text-sm">测试</span></button>
        <button onClick={() => onEdit(channel)} className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"><Edit2 size={16} /><span className="text-sm">编辑</span></button>
        <button onClick={() => onDelete(channel.id)} className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={16} /><span className="text-sm">删除</span></button>
      </div>
    </motion.div>
  );
};
