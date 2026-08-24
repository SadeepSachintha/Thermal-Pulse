import React, { useState, useEffect } from 'react';
import { ShieldAlert, Volume2, VolumeX, AlertTriangle, X } from 'lucide-react';
import { convertTemp, getUnitSymbol } from '../services/mockDataGenerator';

export default function ExcursionAlarmBanner({ activeBreaches = [], unit = 'C' }) {
  const [muted, setMuted] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  const latestBreach = activeBreaches.length > 0 ? activeBreaches[0] : null;

  // Web Audio API Alarm Synthesizer
  const playAlarmSound = () => {
    if (muted) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc2.frequency.setValueAtTime(1760, ctx.currentTime); // A6

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.4);
      osc2.stop(ctx.currentTime + 0.4);
    } catch (e) {
      // AudioContext blocked before user interaction
    }
  };

  useEffect(() => {
    if (latestBreach && !muted && !dismissed) {
      playAlarmSound();
    }
  }, [latestBreach?.id, muted]);

  if (!latestBreach || dismissed) return null;

  const symbol = getUnitSymbol(unit);
  const displayVal = typeof latestBreach.value === 'number' 
    ? `${convertTemp(latestBreach.value, unit)}${symbol}` 
    : latestBreach.value;

  const displayLimit = typeof latestBreach.threshold === 'number' 
    ? `${convertTemp(latestBreach.threshold, unit)}${symbol}` 
    : latestBreach.threshold;

  return (
    <div className="bg-rose-950/90 border-b border-rose-500/60 px-6 py-2.5 backdrop-blur-md sticky top-0 z-50 text-rose-100 shadow-xl shadow-rose-950/50 animate-pulse">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Warning Icon & Details */}
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-rose-500 text-slate-950">
            <ShieldAlert className="w-5 h-5" />
          </div>

          <div className="text-xs">
            <div className="flex items-center gap-2 font-mono">
              <span className="font-bold text-rose-200 uppercase tracking-wide">
                CRITICAL EXCURSION ALARM
              </span>
              <span>•</span>
              <span className="text-white font-bold bg-rose-900 px-2 py-0.5 rounded border border-rose-400">
                {latestBreach.device_id}
              </span>
            </div>
            <p className="text-rose-200 mt-0.5 flex items-center gap-2">
              <span>{latestBreach.type}</span>
              <span>—</span>
              <span className="font-mono font-bold text-white">Value: {displayVal}</span>
              <span>(Limit: {displayLimit})</span>
            </p>
          </div>
        </div>

        {/* Audio Mute & Dismiss Controls */}
        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => setMuted(!muted)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-900/80 hover:bg-rose-800 text-white font-mono transition-colors border border-rose-500/40"
          >
            {muted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                <span>Sound Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                <span>Alarm Sound Active</span>
              </>
            )}
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg hover:bg-rose-900/80 text-rose-300 hover:text-white transition-colors"
            title="Dismiss Banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
