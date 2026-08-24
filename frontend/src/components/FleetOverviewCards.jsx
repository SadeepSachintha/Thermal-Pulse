import React from 'react';
import { Thermometer, ShieldAlert, Snowflake, CheckCircle2, AlertTriangle } from 'lucide-react';
import { convertTemp, getUnitSymbol } from '../services/mockDataGenerator';

export default function FleetOverviewCards({ assets = [], unit = 'C' }) {
  const total = assets.length;
  const compliantCount = assets.filter(a => a.status === 'COMPLIANT').length;
  const breachCount = assets.filter(a => a.status !== 'COMPLIANT').length;
  const complianceRate = total > 0 ? ((compliantCount / total) * 100).toFixed(1) : 100;

  const rawAvgTemp = total > 0 
    ? (assets.reduce((acc, curr) => acc + curr.temperature, 0) / total) 
    : 4.2;

  const displayAvgTemp = convertTemp(rawAvgTemp, unit);
  const symbol = getUnitSymbol(unit);
  const doorOpenCount = assets.filter(a => a.door_open).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* 1. Fleet Compliance Rate */}
      <div className="glass-panel glass-panel-hover rounded-xl p-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fleet Compliance</span>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono text-white glow-emerald">{complianceRate}%</span>
          <span className="text-xs text-emerald-400 font-medium">({compliantCount}/{total} Units)</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
          <div 
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
            style={{ width: `${complianceRate}%` }}
          />
        </div>
      </div>

      {/* 2. Mean Fleet Temperature */}
      <div className="glass-panel glass-panel-hover rounded-xl p-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Fleet Temp</span>
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Thermometer className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono text-white glow-cyan">{displayAvgTemp}{symbol}</span>
          <span className="text-xs text-cyan-400">Target {convertTemp(2, unit)}{symbol} – {convertTemp(8, unit)}{symbol}</span>
        </div>
        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
          <Snowflake className="w-3 h-3 text-cyan-400" />
          Real-time cold chain stability
        </p>
      </div>

      {/* 3. Excursion Breaches */}
      <div className="glass-panel glass-panel-hover rounded-xl p-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Excursion Alerts</span>
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono text-rose-400 glow-rose">{breachCount}</span>
          <span className="text-xs text-rose-300 font-medium">Critical Breaches</span>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Active real-time alerts
        </p>
      </div>

      {/* 4. Sensor Health & Door Status */}
      <div className="glass-panel glass-panel-hover rounded-xl p-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Door Sensors</span>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono text-amber-300">{doorOpenCount}</span>
          <span className="text-xs text-amber-400 font-medium">Doors Ajar</span>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {doorOpenCount > 0 ? 'Door open warning active' : 'All doors secured'}
        </p>
      </div>

    </div>
  );
}
