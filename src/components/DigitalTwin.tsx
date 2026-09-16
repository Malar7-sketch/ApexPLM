import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Zap, 
  Thermometer, 
  Cpu, 
  Gauge, 
  ShieldCheck, 
  AlertTriangle, 
  RotateCcw 
} from 'lucide-react';
import type { TelemetryPoint, PartItem } from '../types/plm';
import { CADViewer3D } from './CADViewer3D';
import { useTheme } from '../context/ThemeContext';

interface DigitalTwinProps {
  part: PartItem;
  telemetry: TelemetryPoint[];
}

export const DigitalTwin: React.FC<DigitalTwinProps> = ({ part, telemetry }) => {
  const { isDark } = useTheme();
  const [currentSensor, setCurrentSensor] = useState({
    tempCelsius: 54.2,
    stressMpa: 215.4,
    rpm: 7800,
    vibrationG: 0.28,
    powerKw: 9.8,
    healthScorePercent: 96.4
  });

  // Simulate live IoT telemetry data stream ticks
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSensor({
        tempCelsius: +(50 + Math.random() * 8).toFixed(1),
        stressMpa: +(200 + Math.random() * 30).toFixed(1),
        rpm: Math.floor(7500 + Math.random() * 600),
        vibrationG: +(0.25 + Math.random() * 0.1).toFixed(2),
        powerKw: +(9.5 + Math.random() * 1.5).toFixed(1),
        healthScorePercent: +(95 + Math.random() * 3).toFixed(1)
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className={`rounded-[18px] p-6 border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className={`p-3 rounded-2xl text-rose-500 border ${
            isDark ? 'bg-rose-500/10 border-rose-500/30' : 'bg-rose-50 border-rose-200'
          }`}>
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight flex items-center space-x-2 ${
              isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
            }`}>
              <span>Live Digital Twin & IoT Telemetry Telematics</span>
              <span className="badge-status badge-active text-[10px] animate-pulse">
                LIVE STREAM 100 Hz
              </span>
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Real-time physical asset health monitoring, stress strain heatmaps, and AI predictive maintenance alerts.
            </p>
          </div>
        </div>
      </div>

      {/* Sensor KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
        <div className={`rounded-2xl p-3.5 border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`text-[10px] block font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Bearing Temp</span>
          <span className="text-lg font-bold text-rose-500 font-mono">{currentSensor.tempCelsius} °C</span>
        </div>
        <div className={`rounded-2xl p-3.5 border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`text-[10px] block font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Shaft Stress</span>
          <span className="text-lg font-bold text-cyan-500 font-mono">{currentSensor.stressMpa} MPa</span>
        </div>
        <div className={`rounded-2xl p-3.5 border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`text-[10px] block font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Drivetrain Speed</span>
          <span className="text-lg font-bold text-amber-500 font-mono">{currentSensor.rpm} RPM</span>
        </div>
        <div className={`rounded-2xl p-3.5 border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`text-[10px] block font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Vibration Level</span>
          <span className="text-lg font-bold text-purple-500 font-mono">{currentSensor.vibrationG} g</span>
        </div>
        <div className={`rounded-2xl p-3.5 border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`text-[10px] block font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Power Consumption</span>
          <span className="text-lg font-bold text-emerald-500 font-mono">{currentSensor.powerKw} kW</span>
        </div>
        <div className={`rounded-2xl p-3.5 border shadow-sm ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          <span className={`text-[10px] block font-semibold ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Health Index</span>
          <span className="text-lg font-bold text-emerald-500 font-mono">{currentSensor.healthScorePercent}%</span>
        </div>
      </div>

      {/* 3D Digital Twin Viewer Canvas */}
      <div className={`rounded-2xl border overflow-hidden shadow-sm ${
        isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
      }`}>
        <CADViewer3D part={part} />
      </div>
    </div>
  );
};

