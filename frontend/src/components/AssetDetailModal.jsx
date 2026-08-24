import React from 'react';
import { X, Thermometer, ShieldAlert, Battery, MapPin, Activity, Clock } from 'lucide-react';
import MktCalculatorWidget from './MktCalculatorWidget';
import ShelfLifePredictorWidget from './ShelfLifePredictorWidget';

export default function AssetDetailModal({ asset, onClose }) {
  if (!asset) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-3xl rounded-2xl p-6 border border-slate-700 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Thermometer className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white font-mono">{asset.device_id}</h2>
              <span className={`px-2.5 py-0.5 text-xs font-bold font-mono rounded ${asset.status === 'COMPLIANT' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-rose-950 text-rose-300 border border-rose-500/40'}`}>
                {asset.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
              <span>{asset.name}</span>
              <span>•</span>
              <span className="font-mono text-cyan-400">{asset.asset_type}</span>
            </p>
          </div>
        </div>

        {/* Core Telemetry Snapshot Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-xl glass-card border border-slate-800">
            <span className="text-[11px] text-slate-400">Current Temp</span>
            <div className="text-2xl font-bold font-mono text-cyan-300 mt-1">{asset.temperature}°C</div>
            <span className="text-[10px] text-slate-500">Limits: {asset.temp_min_celsius}°C – {asset.temp_max_celsius}°C</span>
          </div>

          <div className="p-3 rounded-xl glass-card border border-slate-800">
            <span className="text-[11px] text-slate-400">Relative Humidity</span>
            <div className="text-2xl font-bold font-mono text-blue-300 mt-1">{asset.humidity}%</div>
            <span className="text-[10px] text-slate-500">Max 65% RH</span>
          </div>

          <div className="p-3 rounded-xl glass-card border border-slate-800">
            <span className="text-[11px] text-slate-400">Door State</span>
            <div className={`text-xl font-bold font-mono mt-1 ${asset.door_open ? 'text-rose-400' : 'text-emerald-400'}`}>
              {asset.door_open ? 'DOOR AJAR' : 'Secured'}
            </div>
            <span className="text-[10px] text-slate-500">Magnetic Switch</span>
          </div>

          <div className="p-3 rounded-xl glass-card border border-slate-800">
            <span className="text-[11px] text-slate-400">Battery Level</span>
            <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">{asset.battery}%</div>
            <span className="text-[10px] text-slate-500">IoT Telemetry Node</span>
          </div>
        </div>

        {/* MKT and Shelf-Life Intelligence Widgets */}
        <div className="space-y-4 mb-6">
          <MktCalculatorWidget asset={asset} />
          <ShelfLifePredictorWidget asset={asset} />
        </div>

        {/* Location & TimescaleDB Telemetry Sample History */}
        <div className="p-4 rounded-xl glass-card border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-cyan-400" />
              PostGIS Location Coordinates
            </span>
            <span className="font-mono text-xs text-slate-400">
              LAT: {asset.latitude} | LNG: {asset.longitude}
            </span>
          </div>
          
          <div className="w-full bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 font-mono text-xs text-slate-300 flex justify-between">
            <span>Last Telemetry Packet:</span>
            <span className="text-cyan-400">{new Date(asset.updated_at).toLocaleString()}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
