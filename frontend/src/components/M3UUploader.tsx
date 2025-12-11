import React, { useState, useRef } from 'react';
import { Upload, Link, FileText, Check, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { proxyApi } from '../api';
import { parseM3U } from '../utils/m3uParser';
import { Channel } from '../types';

interface Props {
  onImport: (channels: Partial<Channel>[]) => void;
  loading?: boolean;
}

export const M3UUploader: React.FC<Props> = ({ onImport, loading }) => {
  const [mode, setMode] = useState<'url' | 'file' | 'text'>('url');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUrlSubmit = async () => {
    if (!url.trim()) { setError('请输入URL'); return; }
    setFetching(true); setError('');
    try {
      const content = await proxyApi.getM3U(url);
      const { channels } = parseM3U(content);
      if (channels.length === 0) throw new Error('未解析到频道');
      onImport(channels);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e: any) {
      setError(e.message || '加载失败');
    } finally {
      setFetching(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const { channels } = parseM3U(ev.target?.result as string);
        if (channels.length === 0) throw new Error('未解析到频道');
        onImport(channels);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      } catch (err: any) {
        setError(err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleTextSubmit = () => {
    if (!text.trim()) { setError('请输入内容'); return; }
    try {
      const { channels } = parseM3U(text);
      if (channels.length === 0) throw new Error('未解析到频道');
      onImport(channels);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="glass rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">导入频道列表</h3>
        {success && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-green-400"><Check size={20} />导入成功</motion.div>}
      </div>
      
      <div className="flex gap-2">
        {[{ id: 'url', icon: Link, label: 'URL' }, { id: 'file', icon: Upload, label: '文件' }, { id: 'text', icon: FileText, label: '粘贴' }].map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => { setMode(id as any); setError(''); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${mode === id ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-gray-400 hover:bg-white/10'}`}>
            <Icon size={18} />{label}
          </button>
        ))}
      </div>
      
      {mode === 'url' && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <Input placeholder="输入M3U链接..." value={url} onChange={(e) => setUrl(e.target.value)} icon={<Link size={18} />} className="flex-1" />
            <Button onClick={handleUrlSubmit} loading={fetching || loading}>加载</Button>
          </div>
          {error && <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"><AlertCircle size={18} />{error}</div>}
        </div>
      )}
      
      {mode === 'file' && (
        <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-primary-500/50 transition-colors">
          <Upload className="mx-auto text-gray-400 mb-3" size={40} />
          <p className="text-gray-400">点击上传M3U文件</p>
          <input ref={fileRef} type="file" accept=".m3u,.m3u8,.txt" onChange={handleFileUpload} className="hidden" />
        </div>
      )}
      
      {mode === 'text' && (
        <div className="space-y-3">
          <textarea placeholder="#EXTM3U..." value={text} onChange={(e) => setText(e.target.value)} className="input-field w-full h-40 px-4 py-3 rounded-xl text-white resize-none font-mono text-sm" />
          <Button onClick={handleTextSubmit} loading={loading}>导入</Button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
      )}
    </div>
  );
};
