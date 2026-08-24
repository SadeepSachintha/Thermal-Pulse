import React from 'react';
import { Activity, ShieldCheck, AlertTriangle, Snowflake } from 'lucide-react';
import { predictShelfLifeLocal } from '../services/mockDataGenerator';

export default function ShelfLifePredictorWidget({ asset }) {
  if (!asset) return null;

  const shelfLifeData = predictShelfLifeLocal(asset.temperature, 180);

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'OPTIMAL':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/60';
      case 'MODERATE_DEGRADATION':
        return 'text-amber-300 border-amber-500/30 bg-amber-950/60';
      case 'HIGH_RISK_DEGRADED':
        return 'text-rose-400 border-rose-500/30 bg-rose-950/60';
      default:
        return 'text-cyan-300 border-cyan-500/30 bg-cyan-950/60';
    }
  };

  return (
    <div className="glass-panel rounded-xl p-4 border border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Arrhenius Biopharma Shelf-Life Predictor</h3>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
          k(T) Kinetics Model
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        
        {/* Cumulative Degradation % */}
        <div className="p-3 rounded-lg glass-card border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">Cumulative Decay</span>
          <div className="text-xl font-bold font-mono text-amber-300">
            {shelfLifeData.degradationPct}%
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1 mt-2">
            <div 
              className="bg-amber-400 h-1 rounded-full" 
              style={{ width: `${Math.min(100, shelfLifeData.degradationPct)}%` }} 
            />
          </div>
        </div>

        {/* Remaining Shelf Days */}
        <div className="p-3 rounded-lg glass-card border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">Est. Days Remaining</span>
          <div className="text-xl font-bold font-mono text-emerald-300 glow-emerald">
            {shelfLifeData.remainingDays} Days
          </div>
          <span className="text-[10px] text-slate-500">Nominal 180 Days</span>
        </div>

        {/* Quality Grade */}
        <div className="p-3 rounded-lg glass-card border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">Product Quality</span>
          <span className={`inline-block font-mono font-bold text-[11px] px-2 py-1 rounded border ${getGradeColor(shelfLifeData.grade)}`}>
            {shelfLifeData.grade}
          </span>
        </div>

      </div>
    </div>
  );
}
