import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Square } from 'lucide-react';
import { transcribe } from '@/lib/voice';
import Waveform from './Waveform';

function fmtDur(s) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

export default function PushToTalkButton({ onRecordingComplete, disabled = false }) {
  const [recording,   setRecording]   = useState(false);
  const [processing,  setProcessing]  = useState(false);
  const [duration,    setDuration]    = useState(0);
  const [liveText,    setLiveText]    = useState('');

  const recorderRef  = useRef(null);
  const chunksRef    = useRef([]);
  const startRef     = useRef(null);
  const timerRef     = useRef(null);

  const startRecording = useCallback(async () => {
    if (recording || processing || disabled) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '' });
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
        setRecording(false);
        setProcessing(true);
        setLiveText('');
        try {
          const text = await transcribe(blob);
          onRecordingComplete?.(blob, text);
        } catch (err) {
          onRecordingComplete?.(blob, '');
          console.warn('Transcription failed:', err.message);
        } finally {
          setProcessing(false);
          setDuration(0);
        }
      };
      mr.start(200);
      recorderRef.current = mr;
      startRef.current    = Date.now();
      setRecording(true);
      setDuration(0);
    } catch (err) {
      console.warn('Microphone access denied:', err.message);
    }
  }, [recording, processing, disabled, onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
    }
  }, []);

  // Duration ticker
  useEffect(() => {
    if (recording) {
      timerRef.current = setInterval(() => setDuration(Math.floor((Date.now() - startRef.current) / 1000)), 200);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [recording]);

  // Spacebar push-to-talk (only when no input is focused)
  useEffect(() => {
    const onDown = (e) => {
      if (e.code !== 'Space' || e.repeat) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT') return;
      e.preventDefault();
      startRecording();
    };
    const onUp = (e) => {
      if (e.code !== 'Space') return;
      stopRecording();
    };
    document.addEventListener('keydown', onDown);
    document.addEventListener('keyup',   onUp);
    return () => { document.removeEventListener('keydown', onDown); document.removeEventListener('keyup', onUp); };
  }, [startRecording, stopRecording]);

  if (recording) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
        <button
          onMouseUp={stopRecording}
          onClick={stopRecording}
          title="Stop recording"
          style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0, border: 'none', cursor: 'pointer',
            backgroundColor: '#C0392B', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Square style={{ width: 14, height: 14, fill: '#fff' }} />
        </button>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 10px', borderRadius: 6,
          backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid rgba(192,57,43,0.35)',
        }}>
          <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#C0392B', flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#C0392B', flexShrink: 0 }}>
            REC
          </span>
          <Waveform color="#C0392B" barCount={40} height={20} isActive />
          <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--wr-text-muted)', flexShrink: 0 }}>
            {fmtDur(duration)}
          </span>
        </div>
      </div>
    );
  }

  if (processing) {
    return (
      <button disabled style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0, border: '1px solid var(--wr-border)',
        backgroundColor: 'rgba(240,165,0,0.08)', color: 'var(--wr-amber)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'wait',
      }}>
        <span className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--wr-amber)' }} />
      </button>
    );
  }

  return (
    <button
      onMouseDown={startRecording}
      onMouseUp={stopRecording}
      onMouseLeave={stopRecording}
      disabled={disabled}
      title="Hold to speak · Space"
      aria-label="Push to talk"
      style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
        backgroundColor: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.3)',
        color: 'var(--wr-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.15s',
      }}
    >
      <Mic style={{ width: 15, height: 15 }} />
    </button>
  );
}
