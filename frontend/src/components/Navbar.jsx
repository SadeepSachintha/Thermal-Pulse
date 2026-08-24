import React from 'react';
import { Thermometer, ShieldAlert, Cpu, Snowflake, RefreshCw, Navigation } from 'lucide-react';

export default function Navbar({ isLiveBackend, totalAssets, activeBreachesCount, onRefresh, lastUpdated, onOpenGeofences, unit, onToggleUnit }) {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand Title */}
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
            <Thermometer className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white glow-cyan">
                Thermal<span className="text-cyan-400">Pulse</span>
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-mono">
                v2.0 IoT Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Snowflake className="w-3 h-3 text-cyan-400" />
              Cold Chain & Telemetry Engine
            </p>
          </div>
        </div>

        {/* Real-time Status Badges & Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          
          {/* Temperature Unit Switcher (°C | °F) */}
          <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800 font-mono">
            <button
              onClick={() => onToggleUnit && onToggleUnit('C')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors ${unit === 'C' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              °C
            </button>
            <button
              onClick={() => onToggleUnit && onToggleUnit('F')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors ${unit === 'F' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              °F
            </button>
          </div>

          {/* Geofence Corridor Manager Trigger */}
          <button
            onClick={onOpenGeofences}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 font-mono transition-colors shadow-lg shadow-cyan-950/40"
          >
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            PostGIS Geofences
          </button>

          {/* Live Kafka Stream Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-card border border-slate-800">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isLiveBackend ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isLiveBackend ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="text-slate-300 font-mono">
              {isLiveBackend ? 'Kafka Stream (Active)' : 'Simulator Mode (100 Assets)'}
            </span>
          </div>

          {/* Asset Counter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-card border border-slate-800 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-cyan-300 font-mono">{totalAssets}</span> Monitored Units
          </div>

          {/* Active Breaches Warning */}
          {activeBreachesCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-semibold font-mono">{activeBreachesCount}</span> Excursion Breaches
            </div>
          )}

          {/* Manual Refresh Trigger */}
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-card hover:bg-slate-800 text-slate-300 transition-colors border border-slate-800"
            title="Refresh Telemetry Stream"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-[11px] text-slate-400">{lastUpdated}</span>
          </button>
        </div>

      </div>
    </header>
  );
}
