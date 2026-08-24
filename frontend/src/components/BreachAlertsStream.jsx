import React from 'react';
import { ShieldAlert, AlertTriangle, Clock, Zap, MapPin } from 'lucide-react';

export default function BreachAlertsStream({ breaches = [], onSelectDevice }) {
  return (
    <div className="glass-panel rounded-xl p-4 h-[440px] flex flex-col border border-slate-800">
      
      {/* Stream Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
          <h2 className="text-sm font-semibold text-white tracking-wide">Real-time Redis Excursion Stream</h2>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300">
          Redis Pub/Sub Live
        </span>
      </div>

      {/* Stream Feed Body */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {breaches.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
            <Zap className="w-8 h-8 text-slate-700 mb-2" />
            No active thermal excursion breaches detected.
          </div>
        ) : (
          breaches.map((alert) => (
            <div
              key={alert.id}
              onClick={() => onSelectDevice && onSelectDevice(alert.device_id)}
              className="p-3 rounded-lg glass-card hover:border-rose-500/40 transition-all cursor-pointer border border-slate-800/80 group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs font-bold text-cyan-300 group-hover:text-cyan-200">
                  {alert.device_id}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-rose-400 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  {alert.type}
                </span>
                <span className="font-mono font-bold text-white bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/30">
                  {alert.value}°C (Max {alert.threshold}°C)
                </span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
