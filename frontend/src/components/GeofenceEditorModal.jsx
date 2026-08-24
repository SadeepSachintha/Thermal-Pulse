import React, { useState } from 'react';
import { X, MapPin, ShieldCheck, Plus, Trash2, Navigation } from 'lucide-react';

export default function GeofenceEditorModal({ geofences = [], onSaveGeofence, onDeleteGeofence, onClose }) {
  const [name, setName] = useState('');
  const [zoneType, setZoneType] = useState('SAFE_HUB');
  const [preset, setPreset] = useState('COLOMBO');

  const PRESETS = {
    COLOMBO: {
      name: 'Colombo Western Cold Hub',
      type: 'SAFE_HUB',
      points: [
        [79.8400, 6.9000],
        [79.9000, 6.9000],
        [79.9000, 6.9600],
        [79.8400, 6.9600],
        [79.8400, 6.9000],
      ]
    },
    KANDY_CORRIDOR: {
      name: 'Central Hill Country Pharma Corridor',
      type: 'COLD_CORRIDOR',
      points: [
        [80.6000, 7.2700],
        [80.6800, 7.2700],
        [80.6800, 7.3500],
        [80.6000, 7.3500],
        [80.6000, 7.2700],
      ]
    },
    SOUTHERN_ZONE: {
      name: 'Southern Transit Cold Corridor',
      type: 'COLD_CORRIDOR',
      points: [
        [80.2000, 6.0200],
        [80.3000, 6.0200],
        [80.3000, 6.1200],
        [80.2000, 6.1200],
        [80.2000, 6.0200],
      ]
    }
  };

  const handleApplyPreset = (key) => {
    const p = PRESETS[key];
    setName(p.name);
    setZoneType(p.type);
    setPreset(key);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) return;

    const selectedPreset = PRESETS[preset] || PRESETS.COLOMBO;
    onSaveGeofence({
      id: Date.now(),
      name: name,
      zone_type: zoneType,
      points: selectedPreset.points,
      wkt: `POLYGON((${selectedPreset.points.map(pt => pt.join(' ')).join(', ')}))`
    });

    setName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 border border-slate-700 shadow-2xl relative max-h-[85vh] overflow-y-auto">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-outfit">PostGIS Spatial Geofence Manager</h2>
            <p className="text-xs text-slate-400">Configure safe logistics hubs, transit corridors, and route boundaries</p>
          </div>
        </div>

        {/* Create New Geofence Form */}
        <form onSubmit={handleSubmit} className="p-4 rounded-xl glass-card border border-slate-800 space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-300 font-mono flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-cyan-400" />
              Add PostGIS Spatial Corridor
            </span>

            {/* Presets */}
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleApplyPreset('COLOMBO')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px]"
              >
                Colombo Hub
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('KANDY_CORRIDOR')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px]"
              >
                Kandy Corridor
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Geofence Name</label>
              <input
                type="text"
                placeholder="e.g. Western Transit Corridor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Zone Type Category</label>
              <select
                value={zoneType}
                onChange={(e) => setZoneType(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="SAFE_HUB">SAFE_HUB (Logistics Hub)</option>
                <option value="COLD_CORRIDOR">COLD_CORRIDOR (Transit Highway)</option>
                <option value="RESTRICTED_ZONE">RESTRICTED_ZONE (High Temp Danger)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            Save Spatial Polygon to PostGIS
          </button>
        </form>

        {/* Existing Geofences List */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Active PostGIS Geofences ({geofences.length})
          </h3>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {geofences.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 text-center">No custom geofences configured.</p>
            ) : (
              geofences.map((geo) => (
                <div
                  key={geo.id}
                  className="p-3 rounded-lg glass-card border border-slate-800 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white font-outfit">{geo.name}</span>
                      <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                        {geo.zone_type}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-500 mt-1 truncate max-w-md">
                      {geo.wkt || 'POLYGON PostGIS Spatial Geometry'}
                    </p>
                  </div>

                  <button
                    onClick={() => onDeleteGeofence && onDeleteGeofence(geo.id)}
                    className="p-1.5 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-400 border border-rose-500/30 transition-colors"
                    title="Delete Geofence"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
