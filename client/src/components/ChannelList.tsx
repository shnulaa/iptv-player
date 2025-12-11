import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Channel } from '../types';
import { ChannelCard } from './ChannelCard';
import { Tv } from 'lucide-react';

interface Props { channels: Channel[]; onPlay: (c: Channel) => void; onEdit: (c: Channel) => void; onDelete: (id: string) => void; onTest: (c: Channel) => void; }

export const ChannelList: React.FC<Props> = ({ channels, onPlay, onEdit, onDelete, onTest }) => {
  if (channels.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center">
          <Tv className="text-gray-500" size={40} />
        </div>
        <h3 className="text-xl font-medium text-gray-300 mb-2">暂无频道</h3>
        <p className="text-gray-500">导入M3U文件或手动添加频道</p>
      </div>
    );
  }
  return (
    <div className="channel-grid">
      <AnimatePresence mode="popLayout">
        {channels.map((channel) => <ChannelCard key={channel.id} channel={channel} onPlay={onPlay} onEdit={onEdit} onDelete={onDelete} onTest={onTest} />)}
      </AnimatePresence>
    </div>
  );
};
