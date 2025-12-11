import React, { useState, useRef, useEffect } from 'react';
import { Upload, Link, FileText, Check, History, Trash2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { m3uApi } from '../services/api';
import { ImportHistory } from '../types';

interface Props { onSuccess: () => void; channelCount: number; }

export const M3UUploader: React.FC<Props> = ({ onSuccess, channelCount }) => {
  const [mode, setMode] = useState<'url' | 'file' | 'text' | 'history'>('url');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [histories, setHistories] = useState<ImportHistory[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadHistories(); }, []);

  const loadHistories = async () => {
    try { setHistories(await m3uApi.getHistory()); } catch {}
  };

  const handleUrlSubmit = async () => {
    if (!url) { setError('请输入M3U链接'); return; }
    setLoading(true); setError('');
    try {
      await m3uApi.loadFromUrl(url);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      loadHistories();
      onSuccess();
    } catch (e: any) {
      setError(e.response?.data?.error || '加载失败');
    } finally { setLoading(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true); setError('');
    try {
      await m3uApi.loadFromFile(file);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      loadHistories();
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || '上传失败');
    } finally { setLoading(false); }
  };

  const handleTextSubmit = async () => {
    if (!text.trim()) { setError('请输入M3U内容'); return; }
    setLoading(true); setError('');
    try {
      await m3uApi.loadFromText(text);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      loadHistories();
      onSuccess();
    } catch (e: any) {
      setError(e.response?.data?.error || '解析失败');
    } finally { setLoading(false); }
  };

  const handleReload = async (item: ImportHistory) => {
    if (!item.url) return;
    setUrl(item.url);
    setMode('url');
    setLoading(true); setError('');
    try {
      await m3uApi.loadFromUrl(item.url);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      onSuccess();
    } catch (e: any) {
      setError(e.response?.data?.error || '加载失败');
    } finally { setLoading(false); }
  };

  const handleDeleteHistory = async (id: string) => {
    await m3uApi.deleteHistory(id);
    loadHistories();
  };

  return (
    <div className="glass rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">导入频道列表</h3>
        <div className="flex items-center gap-3">
          {channelCount > 0 && <span className="text-sm text-gray-400">已加载 {channelCount} 个频道</span>}
          {success && <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 text-green-400"><Check size={20} /><span>导入成功</span></motion.div>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[{ id: 'url', icon: Link, label: 'URL链接' }, { id: 'file', icon: Upload, label: '上传文件' }, { id: 'text', icon: FileText, label: '粘贴内容' }, { id: 'history', icon: History, label: '历史记录', badge: histories.length }].map(({ id, icon: Icon, label, badge }) => (
          <button key={id} onClick={() => { setMode(id as any); setError(''); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${mode === id ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
            <Icon size={18} /><span>{label}</span>
            {badge !== undefined && badge > 0 && <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary-500/30 rounded-full">{badge}</span>}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {mode === 'url' && (
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1"><Input type="url" placeholder="输入M3U/M3U8链接..." value={url} onChange={(e) => setUrl(e.target.value)} icon={<Link size={18} />} /></div>
              <Button onClick={handleUrlSubmit} loading={loading}>加载</Button>
            </div>
            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>}
          </div>
        )}

        {mode === 'file' && (
          <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-primary-500/50 transition-all">
            <Upload className="mx-auto text-gray-400 mb-3" size={40} />
            <p className="text-gray-400">点击或拖拽M3U文件到此处</p>
            <input ref={fileRef} type="file" accept=".m3u,.m3u8,.txt" onChange={handleFileUpload} className="hidden" />
          </div>
        )}

        {mode === 'text' && (
          <div className="space-y-3">
            <textarea placeholder="#EXTM3U&#10;#EXTINF:-1,频道名称&#10;http://example.com/stream.m3u8" value={text} onChange={(e) => setText(e.target.value)} className="input-field w-full h-48 px-4 py-3 rounded-xl text-white placeholder-gray-500 resize-none font-mono text-sm" />
            <Button onClick={handleTextSubmit} loading={loading}>导入</Button>
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>
        )}

        {mode === 'history' && (
          <div className="space-y-3">
            {histories.length === 0 ? (
              <div className="text-center py-8 text-gray-500"><History className="mx-auto mb-3 opacity-50" size={40} /><p>暂无导入历史</p></div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {histories.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleString('zh-CN')} · {item.channel_count}个频道</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      {item.url && <Button variant="ghost" size="sm" onClick={() => handleReload(item)} icon={<RefreshCw size={16} />} loading={loading}>重新加载</Button>}
                      <button onClick={() => handleDeleteHistory(item.id)} className="p-2 text-gray-400 hover:text-red-400"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
