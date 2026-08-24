import React from 'react';
import { Thermometer, Calculator, CheckCircle2, AlertOctagon } from 'lucide-react';
import { calculateMktLocal } from '../services/mockDataGenerator';

export default function MktCalculatorWidget({ asset }) {
  if (!asset) return null;

  const history = asset.history || [];
  const mktValue = calculateMktLocal(history);
  const isCompliant = mktValue <= asset.temp_max_celsius;

  return (
    <div className="glass-panel rounded-xl p-4 border border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Haynes Formula MKT Compliance Engine</h3>
        </div>
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
          ΔH/R = 10000 K
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        
        {/* MKT Calculated Display */}
        <div className="p-3 rounded-lg glass-card border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">Mean Kinetic Temperature</span>
          <div className="text-2xl font-bold font-mono text-cyan-300 glow-cyan">
            {mktValue}°C
          </div>
          <span className="text-[10px] text-slate-500 font-mono">WHO / HACCP Formula</span>
        </div>

        {/* Regulatory Status */}
        <div className="p-3 rounded-lg glass-card border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400">WHO Regulatory Status</span>
          <div className="flex items-center gap-2">
            {isCompliant ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-xs font-mono text-emerald-400">COMPLIANT</span>
              </>
            ) : (
              <>
                <AlertOctagon className="w-5 h-5 text-rose-400" />
                <span className="font-bold text-xs font-mono text-rose-400">EXCURSION BREACH</span>
              </>
            )}
          </div>
          <span className="text-[10px] text-slate-500">Threshold: {asset.temp_max_celsius}°C</span>
        </div>

      </div>
    </div>
  );
}
