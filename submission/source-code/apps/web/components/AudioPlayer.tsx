"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Download,
  FastForward,
  Loader2,
} from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface AudioPlayerProps {
  audioId: string;
  title?: string;
  initialDuration?: number;
  downloadFilename?: string;
}

export function AudioPlayer({
  audioId,
  title = "Converted Audio",
  initialDuration = 0,
  downloadFilename = "audio.mp3",
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const audioSrc = `/api/audio/${audioId}`;
  const downloadUrl = `/api/audio/${audioId}/download`;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setIsLoading(false);
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
      setIsPlaying(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, [audioId]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setHasError(true));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const skipSeconds = (seconds: number) => {
    if (!audioRef.current) return;
    const newTime = Math.min(Math.max(0, audioRef.current.currentTime + seconds), duration);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioRef.current.muted = nextMuted;
  };

  const cyclePlaybackRate = () => {
    const rates = [0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  return (
    <div className="w-full rounded-2xl border border-border bg-card p-5 shadow-sm text-card-foreground">
      {/* Hidden HTML5 Audio Element */}
      <audio ref={audioRef} src={audioSrc} preload="metadata" />

      {/* Header Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-0.5">
          <h4 className="font-semibold text-sm text-foreground truncate max-w-md">
            {title}
          </h4>
          <span className="text-xs text-muted-foreground">High-Quality MP3</span>
        </div>

        <a
          href={downloadUrl}
          download={downloadFilename}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Download MP3</span>
        </a>
      </div>

      {/* Scrub Bar */}
      <div className="space-y-1.5">
        <input
          type="range"
          min="0"
          max={duration || 1}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          disabled={hasError || isLoading}
          className="w-full accent-indigo-600 h-2 bg-muted rounded-lg cursor-pointer"
        />

        <div className="flex justify-between text-xs text-muted-foreground font-mono">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        {/* Playback speed & Mute controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cyclePlaybackRate}
            className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-semibold hover:bg-muted transition"
            title="Change Playback Speed"
          >
            {playbackRate}x
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleMute}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 accent-indigo-600 h-1.5 bg-muted rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Center transport controls: Skip Back, Play/Pause, Skip Forward */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => skipSeconds(-10)}
            disabled={hasError || isLoading}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition disabled:opacity-50"
            title="Rewind 10 seconds"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            disabled={hasError || isLoading}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition disabled:opacity-50"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => skipSeconds(10)}
            disabled={hasError || isLoading}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition disabled:opacity-50"
            title="Forward 10 seconds"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>

        <div className="w-20 hidden sm:block" />
      </div>

      {hasError && (
        <p className="mt-3 text-xs text-destructive text-center">
          Failed to stream audio file. Check network connection or audio availability.
        </p>
      )}
    </div>
  );
}

