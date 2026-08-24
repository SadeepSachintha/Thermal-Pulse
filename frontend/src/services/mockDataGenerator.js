// Mock & Live API Integration Service for ThermalPulse Dashboard

export const convertTemp = (tempC, unit = 'C') => {
  if (tempC === null || tempC === undefined) return 'N/A';
  if (unit === 'F') {
    return (tempC * 1.8 + 32).toFixed(1);
  }
  return tempC.toFixed(1);
};

export const getUnitSymbol = (unit = 'C') => {
  return unit === 'F' ? '°F' : '°C';
};

const INITIAL_DEVICES = Array.from({ length: 100 }, (_, i) => {
  const id = `CONT-SENSOR-${String(i + 1).padStart(3, '0')}`;
  const isReefer = i % 2 === 0;
  const isVaccineVault = i % 5 === 0;
  
  let assetType = 'pharma_reefer';
  let baseTemp = 4.5;
  let minTemp = 2.0;
  let maxTemp = 8.0;

  if (isVaccineVault) {
    assetType = 'vaccine_storage';
    baseTemp = -20.0;
    minTemp = -25.0;
    maxTemp = -15.0;
  } else if (!isReefer) {
    assetType = 'cold_room';
    baseTemp = 2.5;
    minTemp = 0.0;
    maxTemp = 4.0;
  }

  // Base GPS centered around Sri Lanka transport routes (Colombo, Kandy, Galle, Dambulla)
  const baseLat = 6.9271 + (Math.random() - 0.5) * 1.5;
  const baseLng = 79.8612 + (Math.random() - 0.5) * 1.5;

  return {
    device_id: id,
    name: `${assetType === 'pharma_reefer' ? 'Pharma Reefer' : assetType === 'vaccine_storage' ? 'Vaccine Vault' : 'Cold Room Unit'} #${i + 1}`,
    asset_type: assetType,
    temperature: parseFloat((baseTemp + (Math.random() - 0.5) * 0.8).toFixed(2)),
    baseTemp,
    temp_min_celsius: minTemp,
    temp_max_celsius: maxTemp,
    humidity: parseFloat((50 + (Math.random() - 0.5) * 10).toFixed(2)),
    door_open: Math.random() < 0.04,
    battery: Math.floor(80 + Math.random() * 20),
    latitude: parseFloat(baseLat.toFixed(6)),
    longitude: parseFloat(baseLng.toFixed(6)),
    updated_at: new Date().toISOString(),
    status: 'COMPLIANT',
    history: Array.from({ length: 20 }, (_, h) => ({
      time: new Date(Date.now() - (20 - h) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temp: parseFloat((baseTemp + (Math.random() - 0.5) * 1.2).toFixed(2)),
    })),
  };
});

let currentDevices = [...INITIAL_DEVICES];
let recentBreaches = [
  {
    id: 1,
    device_id: 'CONT-SENSOR-014',
    type: 'CRITICAL_TEMPERATURE_SPIKE',
    value: 11.4,
    threshold: 8.0,
    timestamp: new Date(Date.now() - 120000).toISOString(),
  },
  {
    id: 2,
    device_id: 'CONT-SENSOR-042',
    type: 'DOOR_EXCURSION',
    value: 'Door Open > 15m',
    threshold: '5m',
    timestamp: new Date(Date.now() - 340000).toISOString(),
  }
];

export const getFleetState = async () => {
  try {
    const res = await fetch('/api/v1/telemetry/live', { signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      const data = await res.json();
      if (data.assets && data.assets.length > 0) {
        return { isLiveBackend: true, assets: data.assets };
      }
    }
  } catch (err) {
    // Fallback to simulated IoT engine
  }

  // Update simulated telemetry values
  currentDevices = currentDevices.map(dev => {
    const isSpike = Math.random() < 0.03;
    let temp = dev.temperature;
    let door = dev.door_open;
    let status = 'COMPLIANT';

    if (isSpike) {
      temp = parseFloat((dev.baseTemp + 6 + Math.random() * 4).toFixed(2));
      door = true;
      status = 'EXCURSION_BREACHED';

      recentBreaches.unshift({
        id: Date.now() + Math.random(),
        device_id: dev.device_id,
        type: 'CRITICAL_TEMPERATURE_SPIKE',
        value: temp,
        threshold: dev.temp_max_celsius,
        timestamp: new Date().toISOString(),
      });
      recentBreaches = recentBreaches.slice(0, 15);
    } else {
      temp = parseFloat((dev.baseTemp + (Math.random() - 0.5) * 0.6).toFixed(2));
      door = Math.random() < 0.05;
      if (temp > dev.temp_max_celsius || temp < dev.temp_min_celsius) {
        status = 'EXCURSION_BREACHED';
      }
    }

    const updatedHistory = [
      ...dev.history.slice(1),
      {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        temp: temp,
      }
    ];

    return {
      ...dev,
      temperature: temp,
      door_open: door,
      status,
      updated_at: new Date().toISOString(),
      history: updatedHistory,
    };
  });

  return { isLiveBackend: false, assets: currentDevices, breaches: recentBreaches };
};

export const calculateMktLocal = (history) => {
  const deltaHOverR = 10000.0;
  if (!history || history.length === 0) return 0;

  let sumExp = 0;
  history.forEach(item => {
    const tempKelvin = item.temp + 273.15;
    sumExp += Math.exp(-deltaHOverR / tempKelvin);
  });

  const avgExp = sumExp / history.length;
  const mktKelvin = deltaHOverR / (-Math.log(avgExp));
  return parseFloat((mktKelvin - 273.15).toFixed(2));
};

export const predictShelfLifeLocal = (mkt, nominalDays = 180) => {
  const refTempKelvin = 5.0 + 273.15;
  const currentTempKelvin = (mkt || 5.0) + 273.15;
  const accelerationFactor = Math.exp(10000.0 * ((1.0 / refTempKelvin) - (1.0 / currentTempKelvin)));
  
  const daysUsedEquivalent = accelerationFactor * 1.5;
  const remainingDays = Math.max(0, nominalDays - daysUsedEquivalent);
  const degradationPct = Math.min(100, Math.max(0, (daysUsedEquivalent / nominalDays) * 100));

  let grade = 'OPTIMAL';
  if (degradationPct > 40) grade = 'MODERATE_DEGRADATION';
  if (degradationPct > 70) grade = 'HIGH_RISK_DEGRADED';
  if (degradationPct >= 100) grade = 'EXPIRED_SPOILED';

  return {
    nominalDays,
    degradationPct: parseFloat(degradationPct.toFixed(1)),
    remainingDays: parseFloat(remainingDays.toFixed(1)),
    grade,
  };
};
