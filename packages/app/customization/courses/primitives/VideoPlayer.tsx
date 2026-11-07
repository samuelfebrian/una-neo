/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { Icon } from "app/ui/atoms/icon";

export interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  onEnded?: () => void;
  className?: string;
}

export function VideoPlayer({
  src,
  poster,
  title,
  onEnded,
  className = ''
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const duration = videoRef.current.duration || 1;
    setProgress((current / duration) * 100);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const targetPercent = parseFloat(e.target.value);
    const duration = videoRef.current.duration || 1;
    videoRef.current.currentTime = (targetPercent / 100) * duration;
    setProgress(targetPercent);
  };

  const toggleSpeed = () => {
    if (!videoRef.current) return;
    const rates = [1, 1.25, 1.5, 2];
    const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIndex] ?? 1;
    videoRef.current.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen?.();
    }
  };

  return (
    <div
      className={`relative group rounded-xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border border-slate-800 shadow-md ${className}`}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          setIsPlaying(false);
          onEnded?.();
        }}
        onClick={togglePlay}
        className="w-full h-full object-contain cursor-pointer"
        playsInline
      />

      {/* Center play button if paused */}
      {!isPlaying && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Play Video"
          className="absolute z-10 w-16 h-16 rounded-full bg-blue-600/90 text-white flex items-center justify-center hover:scale-105 transition-all shadow-xl backdrop-blur-xs cursor-pointer"
        >
          <Icon icon="Play" className="w-7 h-7 fill-white translate-x-0.5" />
        </button>
      )}

      {/* Bottom controls overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent p-3 pt-6 flex flex-col gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
        {/* Progress track */}
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleSeek}
          aria-label="Video Seek Bar"
          className="w-full h-1 bg-slate-700 accent-blue-500 rounded-lg cursor-pointer"
        />

        <div className="flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="hover:text-blue-400 cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Icon icon="Pause" className="w-4 h-4" /> : <Icon icon="Play" className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className="hover:text-blue-400 cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <Icon icon="VolumeX" className="w-4 h-4" /> : <Icon icon="Volume2" className="w-4 h-4" />}
            </button>

            {title && (
              <span className="text-slate-300 font-medium truncate max-w-[200px] sm:max-w-xs">
                {title}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSpeed}
              className="font-mono tabular-nums px-1.5 py-0.5 rounded bg-slate-800 text-[11px] hover:bg-slate-700 cursor-pointer"
              title="Playback Speed"
            >
              {playbackRate}x
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="hover:text-blue-400 cursor-pointer"
              title="Fullscreen"
            >
              <Icon icon="Maximize" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;
