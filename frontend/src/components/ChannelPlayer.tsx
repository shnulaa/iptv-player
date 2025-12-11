import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { X, Volume2, VolumeX, Maximize, Minimize, Play, Pause, AlertCircle } from 'lucide-react';
import { Channel } from '../types';
import { motion } from 'framer-motion';
import { proxyApi } from '../api';

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

    // 判断是否需要代理
    const needsProxy = channel.url.startsWith('http://');
    const isHls = channel.url.includes('.m3u8');
    
    // 获取播放URL
    let playUrl = channel.url;
    if (needsProxy && isHls) {
      playUrl = proxyApi.getHlsUrl(channel.url);
    }

    console.log('Playing URL:', playUrl, 'Original:', channel.url, 'Needs proxy:', needsProxy);

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        xhrSetup: (xhr) => {
          xhr.withCredentials = false;
        },
      });
      
      hlsRef.current = hls;
      hls.loadSource(playUrl);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play().catch(console.error);
      });
      
      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error('HLS Error:', data);
        if (data.fatal) {
          setError(`播放失败: ${data.details}`);
          setLoading(false);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari原生支持HLS
      video.src = playUrl;
      video.addEventListener('loadedmetadata', () => {
        setLoading(false);
        video.play().catch(console.error);
      });
      video.addEventListener('error', () => {
        setError('播放失败: 无法加载视频');
        setLoading(false);
      });
    } else {
      video.src = playUrl;
      video.addEventListener('canplay', () => {
        setLoading(false);
        video.play().catch(console.error);
      });
      video.addEventListener('error', () => {
        setError('播放失败: 无法加载视频');
        setLoading(false);
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel.url]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    
    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (video) video.paused ? video.play() : video.pause();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
      <div ref={containerRef} className="relative w-full max-w-6xl aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"><X size={24} /></button>
        
        <div className="absolute top-4 left-4 z-20 flex items-center gap-3 bg-black/50 rounded-full px-4 py-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white font-medium">{channel.name}</span>
        </div>
        
        <video ref={videoRef} className="w-full h-full object-contain" playsInline />
        
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="loading-spinner" />
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-4">
            <AlertCircle className="text-red-400 mb-4" size={48} />
            <p className="text-red-400 text-center mb-4">{error}</p>
            <div className="text-gray-400 text-sm text-center max-w-md">
              <p>可能的原因：</p>
              <ul className="mt-2 text-left list-disc list-inside">
                <li>源地址已失效</li>
                <li>网络连接问题</li>
                <li>格式不支持</li>
              </ul>
            </div>
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity">
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
