import React, { useState } from 'react';
import { 
  Store, 
  Download, 
  Star, 
  CheckCircle2, 
  Layers, 
  Search 
} from 'lucide-react';
import type { MarketplacePlugin } from '../types/plm';
import { useTheme } from '../context/ThemeContext';

export const PlmMarketplace: React.FC = () => {
  const { isDark } = useTheme();
  const [plugins, setPlugins] = useState<MarketplacePlugin[]>([
    { id: 'PLG-01', name: 'SolidWorks 3D Live Sync Plugin', category: 'CAD Integration', vendor: 'Dassault Systèmes Partner', rating: 4.9, downloads: 12400, installed: true },
    { id: 'PLG-02', name: 'SAP S/4HANA Enterprise Connector', category: 'ERP Connector', vendor: 'SAP AG Certified', rating: 4.8, downloads: 8900, installed: true },
    { id: 'PLG-03', name: 'ANSYS Discovery Real-Time FEA Solver', category: 'CAE Physics', vendor: 'ANSYS Inc', rating: 4.9, downloads: 6500, installed: false },
    { id: 'PLG-04', name: 'Siemens MindSphere IoT MES Connector', category: 'MES Telemetry', vendor: 'Siemens Digital Industries', rating: 4.7, downloads: 4100, installed: false }
  ]);

  const handleInstallToggle = (id: string) => {
    setPlugins((prev) =>
      prev.map((p) => (p.id === id ? { ...p, installed: !p.installed } : p))
    );
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className={`rounded-[18px] p-6 border shadow-sm flex items-center justify-between transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className={`p-3 rounded-2xl text-purple-500 border ${
            isDark ? 'bg-purple-500/10 border-purple-500/30' : 'bg-purple-50 border-purple-200'
          }`}>
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>
              Enterprise PLM & Smart Factory Plugin Store
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Certified integrations for SolidWorks, CATIA, NX, SAP S/4HANA, ANSYS, and Siemens MindSphere.
            </p>
          </div>
        </div>
      </div>

      {/* Plugins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {plugins.map((plg) => (
          <div
            key={plg.id}
            className={`rounded-2xl p-5 border shadow-sm space-y-3 transition-all hover:shadow-md ${
              isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`font-bold font-mono px-2 py-0.5 rounded border text-xs ${
                isDark ? 'text-purple-400 bg-[#0D1628] border-[#243149]' : 'text-purple-600 bg-[#F8FAFC] border-[#E2E8F0]'
              }`}>
                {plg.category}
              </span>
              <span className="flex items-center space-x-1 text-amber-500 font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-500" />
                <span>{plg.rating}</span>
              </span>
            </div>

            <h3 className={`text-sm font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>{plg.name}</h3>
            <div className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}>Vendor: {plg.vendor}</div>

            <div className={`flex items-center justify-between pt-2 border-t ${
              isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
            }`}>
              <span className={`text-[10px] font-mono ${isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{plg.downloads.toLocaleString()} active installs</span>
              <button
                onClick={() => handleInstallToggle(plg.id)}
                className={`btn-sm rounded-xl font-bold text-[11px] inline-flex items-center space-x-1.5 transition-all cursor-pointer ${
                  plg.installed ? 'btn-secondary' : 'btn-primary'
                }`}
              >
                {plg.installed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                <span>{plg.installed ? 'Installed' : 'One-Click Install'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

