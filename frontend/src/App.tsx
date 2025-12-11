import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Tv, Plus, PlayCircle, CheckCircle, XCircle, RefreshCw, Download, Upload, Trash2 } from 'lucide-react';
import { Channel, StatusFilter, Stats } from './types';
import { channelApi } from './api';
import { exportM3U } from './utils/m3uParser';
import { Button } from './components/ui/Button';
import { Tabs } from './components/ui/Tabs';
import { M3UUploader } from './components/M3UUploader';
import { ChannelCard } from './components/ChannelCard';
import { ChannelPlayer } from './components/ChannelPlayer';
import { ChannelEditModal } from './components/ChannelEditModal';
import { SearchFilter } from './components/SearchFilter';
import { Pagination } from './components/Pagination';

const PAGE_SIZE = 12;

function App() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [groups, setGroups] = useState<string[]>(['全部']);
  const [stats, setStats] = useState<Stats>({ total: 0, online: 0, offline: 0, unknown: 0 });
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(true);

  const [activeTab, setActiveTab] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [playingChannel, setPlayingChannel] = useState<Channel | null>(null);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [testingIds, setTestingIds] = useState<Set<string>>(new Set());
  const [batchTesting, setBatchTesting] = useState(false);
  const [testProgress, setTestProgress] = useState({ done: 0, total: 0 });

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('[App] Loading data...');
      
      const [channelsData, groupsData, statsData] = await Promise.all([
        channelApi.getAll(),
        channelApi.getGroups(),
        channelApi.getStats(),
      ]);
      
      console.log('[App] Channels:', channelsData.length);
      console.log('[App] Groups:', groupsData);
      console.log('[App] Stats:', statsData);
      
      setChannels(channelsData);
      setGroups(groupsData.length > 0 ? groupsData : ['全部']);
      setStats(statsData);
      
      if (channelsData.length > 0) {
        setShowUploader(false);
      }
    } catch (e) {
      console.error('[App] Load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // 当 activeTab 不在 groups 中时，重置为 '全部'
  useEffect(() => {
    if (!groups.includes(activeTab)) {
      setActiveTab('全部');
    }
  }, [groups, activeTab]);

  // 过滤频道
  const filteredChannels = useMemo(() => {
    let result = channels;
    
    if (activeTab !== '全部') {
      result = result.filter(c => c.group_title === activeTab);
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q));
    }
    
    return result;
  }, [channels, activeTab, statusFilter, searchQuery]);

  const totalPages = Math.ceil(filteredChannels.length / PAGE_SIZE);
  const paginatedChannels = filteredChannels.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // 导入频道
  const handleImport = async (newChannels: Partial<Channel>[]) => {
    try {
      setLoading(true);
      console.log('[App] Importing channels:', newChannels.length);
      await channelApi.import(newChannels);
      await loadData();
    } catch (e) {
      console.error('[App] Import error:', e);
      alert('导入失败: ' + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 添加/更新频道
  const handleSaveChannel = async (data: Partial<Channel>) => {
    try {
      if (editingChannel) {
        await channelApi.update(editingChannel.id, data);
      } else {
        await channelApi.add(data);
      }
      await loadData();
    } catch (e) {
      console.error('[App] Save error:', e);
      alert('保存失败: ' + (e as Error).message);
    }
  };

  // 删除频道
  const handleDelete = async (id: string) => {
    if (!window.confirm('确定删除此频道？')) return;
    try {
      await channelApi.delete(id);
      await loadData();
    } catch (e) {
      console.error('[App] Delete error:', e);
    }
  };

  // 清空所有
  const handleClearAll = async () => {
    if (!window.confirm('确定清空所有频道？此操作不可恢复！')) return;
    try {
      await channelApi.deleteAll();
      await loadData();
      setShowUploader(true);
      setActiveTab('全部');
    } catch (e) {
      console.error('[App] Clear error:', e);
    }
  };

  // 测试单个频道
  const handleTest = async (channel: Channel) => {
    console.log('[App] Testing channel:', channel.id, channel.name);
    setTestingIds(prev => new Set(prev).add(channel.id));
    
    try {
      const result = await channelApi.test(channel.id);
      console.log('[App] Test result:', result);
      
      // 更新本地状态
      setChannels(prev => prev.map(c => 
        c.id === channel.id 
          ? { ...c, status: result.status as Channel['status'], response_time: result.responseTime } 
          : c
      ));
      
      // 刷新统计
      const newStats = await channelApi.getStats();
      setStats(newStats);
    } catch (e) {
      console.error('[App] Test error:', e);
      alert('测试失败: ' + (e as Error).message);
    } finally {
      setTestingIds(prev => { 
        const next = new Set(prev); 
        next.delete(channel.id); 
        return next; 
      });
    }
  };

  // 批量测试
  const handleBatchTest = async () => {
    const ids = filteredChannels.map(c => c.id);
    if (ids.length === 0) {
      alert('没有可测试的频道');
      return;
    }

    console.log('[App] Batch testing:', ids.length, 'channels');
    setBatchTesting(true);
    setTestProgress({ done: 0, total: ids.length });
    setTestingIds(new Set(ids));

    try {
      // 分批测试，每批5个
      const batchSize = 5;
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        console.log('[App] Testing batch:', i, '-', i + batch.length);
        
        const results = await channelApi.testBatch(batch);
        console.log('[App] Batch results:', results);

        // 更新频道状态
        setChannels(prev => {
          const resultMap = new Map(results.map((r: any) => [r.id, r]));
          return prev.map(c => {
            const result = resultMap.get(c.id);
            if (result) {
              return { 
                ...c, 
                status: result.status as Channel['status'], 
                response_time: result.responseTime 
              };
            }
            return c;
          });
        });

        setTestProgress({ done: Math.min(i + batchSize, ids.length), total: ids.length });
        
        // 从 testingIds 中移除已完成的
        setTestingIds(prev => {
          const next = new Set(prev);
          batch.forEach(id => next.delete(id));
          return next;
        });
      }

      // 刷新统计
      const newStats = await channelApi.getStats();
      setStats(newStats);
    } catch (e) {
      console.error('[App] Batch test error:', e);
      alert('批量测试失败: ' + (e as Error).message);
    } finally {
      setBatchTesting(false);
      setTestingIds(new Set());
    }
  };

  // 导出
  const handleExport = () => {
    const channelsToExport = channels.map(c => ({
      ...c,
      group: c.group_title, // 兼容导出格式
    })) as Channel[];
    const content = exportM3U(channelsToExport);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `playlist_${new Date().toISOString().split('T')[0]}.m3u`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && channels.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4" />
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="animated-bg" />

      <header className="sticky top-0 z-40 glass border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
                <Tv className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">IPTV Player</h1>
                <p className="text-xs text-gray-400">v3.0 - 后端代理版</p>
              </div>
            </div>

            {stats.total > 0 && (
              <div className="hidden md:flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <PlayCircle size={16} className="text-primary-400" />
                  <span className="text-gray-400">总计</span>
                  <span className="text-white font-medium">{stats.total}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-400" />
                  <span className="text-gray-400">在线</span>
                  <span className="text-green-400 font-medium">{stats.online}</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle size={16} className="text-red-400" />
                  <span className="text-gray-400">离线</span>
                  <span className="text-red-400 font-medium">{stats.offline}</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              {channels.length > 0 && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setShowUploader(!showUploader)} icon={<Upload size={18} />}>
                    {showUploader ? '收起' : '导入'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleExport} icon={<Download size={18} />}>
                    导出
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleClearAll} icon={<Trash2 size={18} />}>
                    清空
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => { setEditingChannel(null); setShowEditModal(true); }} icon={<Plus size={18} />}>
                    添加
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <AnimatePresence>
          {showUploader && (
            <div className="mb-8">
              <M3UUploader onImport={handleImport} loading={loading} />
            </div>
          )}
        </AnimatePresence>

        {channels.length > 0 && (
          <div className="space-y-6">
            {/* 分组标签 */}
            {groups.length > 1 && (
              <div className="overflow-x-auto pb-2">
                <Tabs 
                  tabs={groups} 
                  activeTab={activeTab} 
                  onChange={(t) => { 
                    setActiveTab(t); 
                    setCurrentPage(1); 
                  }} 
                />
              </div>
            )}

            {/* 搜索和过滤 */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end justify-between">
              <SearchFilter 
                query={searchQuery} 
                onQueryChange={(q) => { setSearchQuery(q); setCurrentPage(1); }} 
                status={statusFilter} 
                onStatusChange={(s) => { setStatusFilter(s); setCurrentPage(1); }} 
                stats={stats} 
              />

              <Button 
                variant="secondary" 
                onClick={handleBatchTest} 
                loading={batchTesting} 
                disabled={filteredChannels.length === 0}
                icon={<RefreshCw size={18} className={batchTesting ? 'animate-spin' : ''} />}
              >
                {batchTesting ? `测试中 ${testProgress.done}/${testProgress.total}` : `批量测试 (${filteredChannels.length})`}
              </Button>
            </div>

            {/* 测试进度条 */}
            {batchTesting && (
              <div className="glass rounded-xl p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">测试进度</span>
                  <span className="text-white">{testProgress.done} / {testProgress.total}</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${testProgress.total > 0 ? (testProgress.done / testProgress.total) * 100 : 0}%` }} 
                  />
                </div>
              </div>
            )}

            {/* 频道列表 */}
            {paginatedChannels.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">没有找到匹配的频道</p>
                <p className="text-gray-600 text-sm mt-2">尝试调整搜索条件或切换分组</p>
              </div>
            ) : (
              <div className="channel-grid">
                <AnimatePresence mode="popLayout">
                  {paginatedChannels.map(ch => (
                    <ChannelCard 
                      key={ch.id} 
                      channel={ch} 
                      onPlay={setPlayingChannel} 
                      onEdit={(c) => { setEditingChannel(c); setShowEditModal(true); }} 
                      onDelete={handleDelete} 
                      onTest={handleTest} 
                      testing={testingIds.has(ch.id)} 
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* 分页 */}
            <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
          </div>
        )}

        {/* 空状态 */}
        {channels.length === 0 && !showUploader && (
          <div className="text-center py-20">
            <Tv className="mx-auto text-gray-600 mb-4" size={64} />
            <h2 className="text-xl text-gray-400 mb-2">暂无频道</h2>
            <p className="text-gray-500 mb-4">导入 M3U 文件开始使用</p>
            <Button onClick={() => setShowUploader(true)} icon={<Upload size={18} />}>
              导入频道
            </Button>
          </div>
        )}
      </main>

      {/* 播放器 */}
      <AnimatePresence>
        {playingChannel && (
          <ChannelPlayer channel={playingChannel} onClose={() => setPlayingChannel(null)} />
        )}
      </AnimatePresence>

      {/* 编辑弹窗 */}
      <ChannelEditModal 
        isOpen={showEditModal} 
        onClose={() => { setShowEditModal(false); setEditingChannel(null); }} 
        channel={editingChannel} 
        onSave={handleSaveChannel} 
        groups={groups.filter(g => g !== '全部')} 
      />
    </div>
  );
}

export default App;
