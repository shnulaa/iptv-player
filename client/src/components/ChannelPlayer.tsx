import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { X, Volume2, VolumeX, Maximize, Minimize, Play, Pause } from 'lucide-react';
import { motion } from 'framer-motion';
import { Channel } from '../types';
import { proxyApi } from '../services/api';

interface Props { channel: Channel; onClose: () => void; }

export const ChannelPlayer: React.FC<Props> = ({ channel, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    setLoading(true);
    setError(null);

    // 使用代理URL来解决HTTP混合内容问题
    const streamUrl = proxyApi.getStreamUrl(channel.url);
    console.log('Playing:', channel.url);
    console.log('Proxy URL:', streamUrl);

    if (Hls.isSupported() && channel.url.includes('.m3u8')) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { setLoading(false); video.play().catch(() => {}); });
      hls.on(Hls.Events.ERROR, (_, data) => { 
        if (data.fatal) { 
          console.error('HLS Error:', data);
          setError('播放失败: ' + data.details); 
          setLoading(false); 
        } 
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari原生支持
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => { setLoading(false); video.play().catch(() => {}); });
      video.addEventListener('error', () => { setError('播放失败'); setLoading(false); });
    } else {
      video.src = streamUrl;
      video.oncanplay = () => { setLoading(false); video.play().catch(() => {}); };
      video.onerror = () => { setError('播放失败'); setLoading(false); };
    }
    
    return () => { if (hlsRef.current) hlsRef.current.destroy(); };
  }, [channel.url]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    return () => { video.removeEventListener('play', onPlay); video.removeEventListener('pause', onPause); };
  }, []);

  const togglePlay = () => { const v = videoRef.current; if (v) v.paused ? v.play() : v.pause(); };
  const toggleMute = () => { const v = videoRef.current; if (v) { v.muted = !v.muted; setIsMuted(!isMuted); } };
  const toggleFullscreen = () => {
    const c = containerRef.current;
    if (!c) return;
    if (!document.fullscreenElement) { c.requestFullscreen(); setIsFullscreen(true); }
    else { document.exitFullscreen(); setIsFullscreen(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
      <div ref={containerRef} className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"><X size={24} /></button>
        <div className="absolute top-4 left-4 z-20 flex items-center gap-3 bg-black/50 rounded-full px-4 py-2"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /><span className="text-white font-medium">{channel.name}</span></div>
        <video ref={videoRef} className="w-full h-full object-contain" playsInline autoPlay />
        {loading && <div className="absolute inset-0 flex items-center justify-center bg-black/50"><div className="loading-spinner" /></div>}
        {error && <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50"><p className="text-red-400 mb-4">{error}</p></div>}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-center gap-4">
            <button onClick={togglePlay} className="p-3 bg-white/20 rounded-full hover:bg-white/30">{isPlaying ? <Pause size={24} /> : <Play size={24} />}</button>
            <button onClick={toggleMute} className="p-3 bg-white/20 rounded-full hover:bg-white/30">{isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}</button>
            <button onClick={toggleFullscreen} className="p-3 bg-white/20 rounded-full hover:bg-white/30">{isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
