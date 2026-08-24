import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function TelemetryChart({ history = [], tempMin = 2.0, tempMax = 8.0 }) {
  const labels = history.map(item => item.time);
  const temps = history.map(item => item.temp);

  const data = {
    labels: labels.length > 0 ? labels : ['12:00', '12:05', '12:10', '12:15', '12:20'],
    datasets: [
      {
        label: 'Temperature (°C)',
        data: temps.length > 0 ? temps : [4.2, 4.5, 4.3, 4.6, 4.4],
        borderColor: '#06b6d4',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
          gradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
          return gradient;
        },
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointBackgroundColor: temps.map(t => t > tempMax || t < tempMin ? '#f43f5e' : '#06b6d4'),
        pointBorderColor: temps.map(t => t > tempMax || t < tempMin ? '#ffe4e6' : '#cff4fc'),
        pointRadius: temps.map(t => t > tempMax || t < tempMin ? 6 : 3),
        pointHoverRadius: 7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: '#94a3b8',
          font: { family: 'JetBrains Mono', size: 11 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#06b6d4',
        bodyColor: '#f8fafc',
        borderColor: 'rgba(6, 182, 212, 0.3)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (context) => `Temp: ${context.raw}°C`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 10 } },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 10 } },
        suggestedMin: Math.min(...temps, tempMin) - 2,
        suggestedMax: Math.max(...temps, tempMax) + 2,
      },
    },
  };

  return (
    <div className="glass-panel rounded-xl p-4 border border-slate-800 h-[240px] flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-white font-outfit">Real-Time Telemetry Curve (TimescaleDB Packets)</span>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="text-rose-400 font-semibold">Max Threshold: {tempMax}°C</span>
          <span className="text-cyan-400 font-semibold">Min Threshold: {tempMin}°C</span>
        </div>
      </div>
      <div className="flex-1 w-full h-full relative">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
