import { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import Waveform from './Waveform';

const BAR_COUNT = 48;

function fmt(s) {
  const sec = Math.floor(s);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

export default function VoicePlayer({ audioUrl, duration = 0, color = '#F0A500', voiceLabel, isPlaying, onPlayPause }) {
  const audioRef    = useRef(null);
  const ctxRef      = useRef(null);
  const analyserRef = useRef(null);
  const frameRef    = useRef(null);
  const [bars,    setBars]    = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [ready,   setReady]   = useState(false);

  // Create audio + WebAudio graph once audioUrl is set
  useEffect(() => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audio.preload = 'auto';
    audioRef.current = audio;

    const animate = () => {
      if (!analyserRef.current) return;
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(data);
      setBars(Array.from(data).slice(0, BAR_COUNT).map(v => v / 255));
      setElapsed(audio.currentTime);
      frameRef.current = requestAnimationFrame(animate);
    };

    const initCtx = () => {
      if (ctxRef.current) return;
      const ctx      = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = BAR_COUNT * 2;
      const source   = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      ctxRef.current      = ctx;
      analyserRef.current = analyser;
    };

    audio.addEventListener('canplaythrough', () => setReady(true));
    audio.addEventListener('play',  () => { initCtx(); ctxRef.current?.resume(); frameRef.current = requestAnimationFrame(animate); });
    audio.addEventListener('pause', () => cancelAnimationFrame(frameRef.current));
    audio.addEventListener('ended', () => { cancelAnimationFrame(frameRef.current); setBars(null); setElapsed(0); onPlayPause?.(); });

    return () => {
      audio.pause();
      cancelAnimationFrame(frameRef.current);
      ctxRef.current?.close();
      ctxRef.current      = null;
      analyserRef.current = null;
    };
  }, [audioUrl]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.play().catch(() => {});
    else           audioRef.current.pause();
  }, [isPlaying]);

  const pct = duration > 0 ? Math.min(elapsed / duration, 1) : 0;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 10px', borderRadius: 5,
      backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)',
    }}>
      <button
        onClick={onPlayPause}
        disabled={!ready && !audioUrl}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        style={{
          width: 26, height: 26, borderRadius: '50%', flexShrink: 0, border: 'none', cursor: 'pointer',
          backgroundColor: color, color: '#0D1B2A',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: ready || audioUrl ? 1 : 0.5,
        }}
      >
        {isPlaying
          ? <Pause  style={{ width: 10, height: 10, fill: '#0D1B2A' }} />
          : <Play   style={{ width: 10, height: 10, fill: '#0D1B2A' }} />
        }
      </button>

      {/* Waveform with progress overlay */}
      <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
        <Waveform bars={bars || undefined} color={color} barCount={BAR_COUNT} height={18} isActive={isPlaying && !bars} />
        {/* Progress overlay */}
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: `${pct * 100}%`,
          backgroundColor: 'rgba(0,0,0,0.35)',
          borderRadius: 2,
          pointerEvents: 'none',
          transition: 'width 0.1s linear',
        }} />
      </div>

      <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--wr-text-muted)', flexShrink: 0 }}>
        {isPlaying ? `${fmt(elapsed)} / ` : ''}{fmt(duration)}
      </span>

      {voiceLabel && (
        <span style={{
          fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace',
          padding: '1px 5px', borderRadius: 3,
          backgroundColor: 'rgba(138,155,181,0.08)', color: 'var(--wr-text-muted)',
          flexShrink: 0,
        }}>
          {voiceLabel}
        </span>
      )}
    </div>
  );
}
