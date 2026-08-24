import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { Thermometer, Navigation, Battery } from 'lucide-react';

// Custom Leaflet Icons for Compliant vs Breach Units
const createCustomIcon = (status, temp) => {
  const isBreach = status !== 'COMPLIANT' || temp > 8.0 || temp < 2.0;
  const colorClass = isBreach ? 'bg-rose-500 border-rose-300 text-white shadow-rose-500/50' : 'bg-cyan-500 border-cyan-300 text-slate-950 shadow-cyan-500/50';

  const html = `
    <div class="relative flex items-center justify-center">
      <div class="w-8 h-8 rounded-full border-2 ${colorClass} flex items-center justify-center font-mono font-bold text-[10px] shadow-lg transform hover:scale-110 transition-transform">
        ${temp}°
      </div>
      <div class="absolute -bottom-1 w-2 h-2 rotate-45 ${isBreach ? 'bg-rose-500' : 'bg-cyan-500'}"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

export default function LiveTelemetryMap({ assets = [], geofences = [], onSelectAsset }) {
  // Map center over Sri Lanka transport corridor hub
  const center = [6.9271, 79.8612];

  return (
    <div className="glass-panel rounded-xl p-4 h-[440px] flex flex-col relative overflow-hidden border border-slate-800">
      
      {/* Map Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white tracking-wide">Live Asset Tracking & PostGIS Corridors</h2>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-cyan-300">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            Compliant Units
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-sm border border-emerald-400 bg-emerald-500/20"></span>
            PostGIS Geofence
          </div>
          <div className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            Excursion Breach
          </div>
        </div>
      </div>

      {/* Leaflet Map Body */}
      <div className="w-full flex-1 rounded-lg overflow-hidden border border-slate-800/80">
        <MapContainer 
          center={center} 
          zoom={8} 
          scrollWheelZoom={true} 
          className="w-full h-full"
        >
          {/* Dark Mode Map Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Render Active PostGIS Geofence Polygons */}
          {geofences.map((geo) => {
            if (!geo.points || geo.points.length === 0) return null;
            // Convert [lng, lat] to Leaflet [lat, lng]
            const leafletPositions = geo.points.map(pt => [pt[1], pt[0]]);
            const isCorridor = geo.zone_type === 'COLD_CORRIDOR';

            return (
              <Polygon
                key={geo.id}
                positions={leafletPositions}
                pathOptions={{
                  color: isCorridor ? '#06b6d4' : '#10b981',
                  fillColor: isCorridor ? '#06b6d4' : '#10b981',
                  fillOpacity: 0.15,
                  weight: 2,
                  dashArray: isCorridor ? '4, 4' : null,
                }}
              >
                <Popup>
                  <div className="p-1 font-mono text-xs">
                    <span className="font-bold text-cyan-300 block">{geo.name}</span>
                    <span className="text-[10px] text-slate-400">Type: {geo.zone_type}</span>
                  </div>
                </Popup>
              </Polygon>
            );
          })}

          {/* Render Telemetry Devices */}
          {assets.map((dev) => (
            <Marker
              key={dev.device_id}
              position={[dev.latitude, dev.longitude]}
              icon={createCustomIcon(dev.status, dev.temperature)}
              eventHandlers={{
                click: () => onSelectAsset && onSelectAsset(dev),
              }}
            >
              <Popup>
                <div className="p-1 min-w-[200px]">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-1.5 mb-2">
                    <span className="font-mono font-bold text-xs text-cyan-400">{dev.device_id}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${dev.status === 'COMPLIANT' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-rose-950 text-rose-300 border border-rose-500/40'}`}>
                      {dev.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Thermometer className="w-3 h-3 text-cyan-400" /> Temperature:
                      </span>
                      <span className="font-mono font-bold text-white">{dev.temperature}°C</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Door Status:</span>
                      <span className={`font-semibold ${dev.door_open ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {dev.door_open ? 'DOOR AJAR' : 'Secured'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Battery className="w-3 h-3 text-emerald-400" /> Battery:
                      </span>
                      <span className="font-mono">{dev.battery}%</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectAsset && onSelectAsset(dev)}
                    className="w-full mt-3 py-1 text-[11px] font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors text-center"
                  >
                    View Analytics & MKT
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

    </div>
  );
}
