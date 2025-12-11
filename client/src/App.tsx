import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Tv, Plus, PlayCircle, CheckCircle, XCircle, RefreshCw, Download, Upload, Trash2 } from 'lucide-react';
import { Channel, StatusFilter, Stats } from './types';
import { channelApi, proxyApi } from './services/api';
import { Button } from './components/ui/Button';
import { Tabs } from './components/ui/Tabs';
import { M3UUploader } from './components/M3UUploader';
import { ChannelList } from './components/ChannelList';
import { ChannelPlayer } from './components/ChannelPlayer';
import { ChannelEditModal } from './components/ChannelEditModal';
import { SearchFilter } from './components/SearchFilter';
import { Pagination } from './components/Pagination';

const ITEMS_PER_PAGE = 12;

function App() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [groups, setGroups] = useState<string[]>(['全部']);
  const [stats, setStats] = useState<Stats>({ total: 0, online: 0, offline: 0, unknown: 0 });
  const [loading, setLoading] = useState(true);
  
  const [showUploader, setShowUploader] = useState(true);
  const [activeTab, setActiveTab] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('全部');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [playingChannel, setPlayingChannel] = useState<Channel | null>(null);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testProgress, setTestProgress] = useState({ completed: 0, total: 0 });

  const loadData = useCallback(async () => {
    try {
      const [channelsData, groupsData, statsData] = await Promise.all([
        channelApi.getAll({ search: searchQuery, group: selectedGroup !== '全部' ? selectedGroup : undefined, status: statusFilter !== 'all' ? statusFilter : undefined }),
        channelApi.getGroups(),
        channelApi.getStats(),
      ]);
      setChannels(channelsData);
      setGroups(groupsData);
      setStats(statsData);
      if (channelsData.length > 0) setShowUploader(false);
    } catch (e) { console.error('Load error:', e); }
    finally { setLoading(false); }
  }, [searchQuery, selectedGroup, statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredChannels = useMemo(() => {
    let result = channels;
    if (activeTab !== '全部') result = result.filter(c => c.group_name === activeTab);
    return result;
  }, [channels, activeTab]);

  const paginatedChannels = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredChannels.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredChannels, currentPage]);

  const totalPages = Math.ceil(filteredChannels.length / ITEMS_PER_PAGE);

  const handleSaveChannel = async (data: Partial<Channel>) => {
    try {
      if (editingChannel) await channelApi.update(editingChannel.id, data);
      else await channelApi.create(data);
      loadData();
    } catch (e) { console.error('Save error:', e); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定删除?')) return;
    try { await channelApi.delete(id); loadData(); } catch {}
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('确定清除所有频道?')) return;
    try { await channelApi.deleteAll(); loadData(); setShowUploader(true); } catch {}
  };

  const handleTestChannel = async (channel: Channel) => {
    try {
      await channelApi.updateStatus(channel.id, 'testing');
      setChannels(prev => prev.map(c => c.id === channel.id ? { ...c, status: 'testing' } : c));
      const result = await proxyApi.testChannel(channel.url);
      const newStatus = result.online ? 'online' : 'offline';
      await channelApi.updateStatus(channel.id, newStatus);
      setChannels(prev => prev.map(c => c.id === channel.id ? { ...c, status: newStatus } : c));
      loadData();
    } catch { 
      await channelApi.updateStatus(channel.id, 'offline');
      setChannels(prev => prev.map(c => c.id === channel.id ? { ...c, status: 'offline' } : c));
    }
  };

  const handleTestAll = async () => {
    const toTest = filteredChannels;
    if (toTest.length === 0) return;
    
    setTesting(true);
    setTestProgress({ completed: 0, total: toTest.length });
    
    for (let i = 0; i < toTest.length; i++) {
      await handleTestChannel(toTest[i]);
      setTestProgress({ completed: i + 1, total: toTest.length });
    }
    
    setTesting(false);
    loadData();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="loading-spinner" /></div>;

  return (
    <div className="min-h-screen">
      <div className="animated-bg" />
      
      <header className="sticky top-0 z-40 glass border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center"><Tv className="text-white" size={24} /></div>
              <div><h1 className="text-xl font-bold text-white">IPTV Player</h1><p className="text-xs text-gray-400">v3.0 - 后端存储版</p></div>
            </div>
            
            {stats.total > 0 && (
              <div className="hidden md:flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2"><PlayCircle size={16} className="text-primary-400" /><span className="text-gray-400">总计</span><span className="text-white font-medium">{stats.total}</span></div>
                <div className="flex items-center gap-2"><CheckCircle size={16} className="text-green-400" /><span className="text-gray-400">在线</span><span className="text-green-400 font-medium">{stats.online}</span></div>
                <div className="flex items-center gap-2"><XCircle size={16} className="text-red-400" /><span className="text-gray-400">离线</span><span className="text-red-400 font-medium">{stats.offline}</span></div>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              {stats.total > 0 && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setShowUploader(!showUploader)} icon={<Upload size={18} />}>{showUploader ? '收起' : '导入'}</Button>
                  <a href="/api/m3u/export" className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-xl"><Download size={18} />导出</a>
                  <Button variant="ghost" size="sm" onClick={handleDeleteAll} icon={<Trash2 size={18} />}>清除</Button>
                  <Button variant="secondary" size="sm" onClick={() => { setEditingChannel(null); setShowEditModal(true); }} icon={<Plus size={18} />}>添加</Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <AnimatePresence>{showUploader && <div className="mb-8"><M3UUploader onSuccess={loadData} channelCount={stats.total} /></div>}</AnimatePresence>
        
        {stats.total > 0 && (
          <div className="space-y-6">
            <div className="w-full overflow-x-auto pb-2"><Tabs tabs={groups} activeTab={activeTab} onChange={(t) => { setActiveTab(t); setCurrentPage(1); }} /></div>
            
            <SearchFilter searchQuery={searchQuery} onSearchChange={(q) => { setSearchQuery(q); setCurrentPage(1); }} groups={groups} selectedGroup={selectedGroup} onGroupChange={(g) => { setSelectedGroup(g); setCurrentPage(1); }} statusFilter={statusFilter} onStatusFilterChange={(s) => { setStatusFilter(s); setCurrentPage(1); }} stats={stats} />
            
            <div className="flex items-center gap-4">
              <Button variant="secondary" onClick={handleTestAll} loading={testing} icon={<RefreshCw size={18} />}>
                {testing ? `测试中 ${testProgress.completed}/${testProgress.total}` : `批量测试 (${filteredChannels.length})`}
              </Button>
              {testing && (
                <div className="flex-1 glass rounded-xl p-3">
                  <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${(testProgress.completed / testProgress.total) * 100}%` }} /></div>
                </div>
              )}
            </div>
            
            <ChannelList channels={paginatedChannels} onPlay={setPlayingChannel} onEdit={(c) => { setEditingChannel(c); setShowEditModal(true); }} onDelete={handleDelete} onTest={handleTestChannel} />
            <Pagination current={currentPage} total={totalPages} onChange={(p) => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
          </div>
        )}
      </main>

      <AnimatePresence>{playingChannel && <ChannelPlayer channel={playingChannel} onClose={() => setPlayingChannel(null)} />}</AnimatePresence>
      <ChannelEditModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} channel={editingChannel} onSave={handleSaveChannel} groups={groups} />
    </div>
  );
}

export default App;
