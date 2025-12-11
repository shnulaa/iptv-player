import React, { useState, useEffect } from 'react';
import { Channel } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Radio, Link, Folder, Image } from 'lucide-react';

interface Props { isOpen: boolean; onClose: () => void; channel: Channel | null; onSave: (data: Partial<Channel>) => void; groups: string[]; }

export const ChannelEditModal: React.FC<Props> = ({ isOpen, onClose, channel, onSave, groups }) => {
  const [form, setForm] = useState({ name: '', url: '', group_name: '', logo: '' });

  useEffect(() => {
    if (channel) setForm({ name: channel.name, url: channel.url, group_name: channel.group_name, logo: channel.logo || '' });
    else setForm({ name: '', url: '', group_name: groups.find(g => g !== '全部') || '未分类', logo: '' });
  }, [channel, groups]);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(form); onClose(); };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={channel ? '编辑频道' : '添加频道'}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div><label className="block text-sm text-gray-300 mb-2">频道名称</label><Input placeholder="输入频道名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} icon={<Radio size={18} />} required /></div>
        <div><label className="block text-sm text-gray-300 mb-2">播放地址</label><Input placeholder="输入M3U8地址" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} icon={<Link size={18} />} required /></div>
        <div><label className="block text-sm text-gray-300 mb-2">分组</label><div className="relative"><div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Folder size={18} /></div><select value={form.group_name} onChange={(e) => setForm({ ...form, group_name: e.target.value })} className="input-field w-full appearance-none pl-10 pr-10 py-2.5 rounded-xl text-white">{groups.filter(g => g !== '全部').map((g) => <option key={g} value={g} className="bg-dark-200">{g}</option>)}</select></div></div>
        <div><label className="block text-sm text-gray-300 mb-2">Logo URL</label><Input placeholder="输入Logo地址（可选）" value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} icon={<Image size={18} />} /></div>
        <div className="flex gap-3 pt-4"><Button type="button" variant="secondary" onClick={onClose} className="flex-1">取消</Button><Button type="submit" className="flex-1">保存</Button></div>
      </form>
    </Modal>
  );
};
