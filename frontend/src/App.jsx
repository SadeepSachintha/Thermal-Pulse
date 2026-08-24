import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import FleetOverviewCards from './components/FleetOverviewCards';
import LiveTelemetryMap from './components/LiveTelemetryMap';
import BreachAlertsStream from './components/BreachAlertsStream';
import AssetDetailModal from './components/AssetDetailModal';
import GeofenceEditorModal from './components/GeofenceEditorModal';
import ExcursionAlarmBanner from './components/ExcursionAlarmBanner';
import { getFleetState, convertTemp, getUnitSymbol } from './services/mockDataGenerator';
import { Search, Cpu } from 'lucide-react';

export default function App() {
  const [assets, setAssets] = useState([]);
  const [breaches, setBreaches] = useState([]);
  const [unit, setUnit] = useState('C');
  const [isLiveBackend, setIsLiveBackend] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showGeofencesModal, setShowGeofencesModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

  const [geofences, setGeofences] = useState([
    {
      id: 1,
      name: 'Colombo Western Cold Hub',
      zone_type: 'SAFE_HUB',
      points: [
        [79.8400, 6.9000],
        [79.9000, 6.9000],
        [79.9000, 6.9600],
        [79.8400, 6.9600],
        [79.8400, 6.9000],
      ],
      wkt: 'POLYGON((79.8400 6.9000, 79.9000 6.9000, 79.9000 6.9600, 79.8400 6.9600, 79.8400 6.9000))'
    },
    {
      id: 2,
      name: 'Central Hill Country Pharma Corridor',
      zone_type: 'COLD_CORRIDOR',
      points: [
        [80.6000, 7.2700],
        [80.6800, 7.2700],
        [80.6800, 7.3500],
        [80.6000, 7.3500],
        [80.6000, 7.2700],
      ],
      wkt: 'POLYGON((80.6000 7.2700, 80.6800 7.2700, 80.6800 7.3500, 80.6000 7.3500, 80.6000 7.2700))'
    }
  ]);

  const fetchTelemetryData = async () => {
    const data = await getFleetState();
    setIsLiveBackend(data.isLiveBackend);
    if (data.assets) setAssets(data.assets);
    if (data.breaches) setBreaches(data.breaches);
    setLastUpdated(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    fetchTelemetryData();
    const interval = setInterval(fetchTelemetryData, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveGeofence = (newGeo) => {
    setGeofences(prev => [newGeo, ...prev]);
  };

  const handleDeleteGeofence = (id) => {
    setGeofences(prev => prev.filter(g => g.id !== id));
  };

  const filteredAssets = assets.filter(dev => {
    const matchesSearch = dev.device_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          dev.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || 
                          (filterStatus === 'BREACH' && dev.status !== 'COMPLIANT') ||
                          (filterStatus === 'COMPLIANT' && dev.status === 'COMPLIANT');
    return matchesSearch && matchesStatus;
  });

  const activeBreachesCount = assets.filter(a => a.status !== 'COMPLIANT').length;
  const unitSymbol = getUnitSymbol(unit);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Real-time Excursion Alarm Banner */}
      <ExcursionAlarmBanner activeBreaches={breaches} unit={unit} />

      {/* Navigation Header */}
      <Navbar 
        isLiveBackend={isLiveBackend}
        totalAssets={assets.length}
        activeBreachesCount={activeBreachesCount}
        onRefresh={fetchTelemetryData}
        lastUpdated={lastUpdated}
        onOpenGeofences={() => setShowGeofencesModal(true)}
        unit={unit}
        onToggleUnit={(newUnit) => setUnit(newUnit)}
      />

      {/* Main Dashboard Container */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 space-y-6">
        
        {/* KPI Overview Cards */}
        <FleetOverviewCards assets={assets} breaches={breaches} unit={unit} />

        {/* Real-time Map & Excursion Breach Stream split grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <LiveTelemetryMap 
              assets={filteredAssets} 
              geofences={geofences}
              unit={unit}
              onSelectAsset={(asset) => setSelectedAsset(asset)} 
            />
          </div>
          <div className="lg:col-span-1">
            <BreachAlertsStream 
              breaches={breaches} 
              unit={unit}
              onSelectDevice={(id) => {
                const found = assets.find(a => a.device_id === id);
                if (found) setSelectedAsset(found);
              }} 
            />
          </div>
        </div>

        {/* Fleet Grid & Search Filter Section */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white font-outfit">Active IoT Telemetry Fleet (100 Units)</h2>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Status Filter buttons */}
              <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800 text-xs">
                <button
                  onClick={() => setFilterStatus('ALL')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${filterStatus === 'ALL' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  All ({assets.length})
                </button>
                <button
                  onClick={() => setFilterStatus('COMPLIANT')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${filterStatus === 'COMPLIANT' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Compliant
                </button>
                <button
                  onClick={() => setFilterStatus('BREACH')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${filterStatus === 'BREACH' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Excursions ({activeBreachesCount})
                </button>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search device ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono w-48"
                />
              </div>

            </div>
          </div>

          {/* Grid Table of Telemetry Fleet */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 max-h-[380px] overflow-y-auto pr-1">
            {filteredAssets.map((dev) => {
              const isBreach = dev.status !== 'COMPLIANT';
              const displayTemp = convertTemp(dev.temperature, unit);

              return (
                <div
                  key={dev.device_id}
                  onClick={() => setSelectedAsset(dev)}
                  className={`p-3 rounded-lg glass-card cursor-pointer border transition-all hover:scale-[1.02] ${isBreach ? 'border-rose-500/50 bg-rose-950/20' : 'border-slate-800 hover:border-cyan-500/40'}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-cyan-300">{dev.device_id}</span>
                    <span className={`w-2 h-2 rounded-full ${isBreach ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'}`}></span>
                  </div>

                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-xl font-bold font-mono text-white">{displayTemp}{unitSymbol}</span>
                    <span className="text-[10px] text-slate-400">{dev.humidity}% RH</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800/60">
                    <span>{dev.door_open ? 'DOOR OPEN' : 'Door Closed'}</span>
                    <span className="font-mono">{dev.battery}% Bat</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </main>

      {/* Asset Inspection Modal */}
      {selectedAsset && (
        <AssetDetailModal 
          asset={selectedAsset} 
          unit={unit}
          onClose={() => setSelectedAsset(null)} 
        />
      )}

      {/* PostGIS Geofence Manager Modal */}
      {showGeofencesModal && (
        <GeofenceEditorModal 
          geofences={geofences}
          onSaveGeofence={handleSaveGeofence}
          onDeleteGeofence={handleDeleteGeofence}
          onClose={() => setShowGeofencesModal(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 text-center text-xs text-slate-600 font-mono">
        ThermalPulse v2.0 Smart Cold Chain Telemetry Engine & Analytics Platform
      </footer>

    </div>
  );
}
