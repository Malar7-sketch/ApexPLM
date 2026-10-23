import React, { useState } from 'react';
import { 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  ArrowRightLeft, 
  Code, 
  FileCode, 
  Layers, 
  Send 
} from 'lucide-react';
import type { PartItem } from '../types/plm';
import { useTheme } from '../context/ThemeContext';

interface ErpConnectorProps {
  parts: PartItem[];
}

export const ErpConnector: React.FC<ErpConnectorProps> = ({ parts }) => {
  const { isDark } = useTheme();
  const [selectedErp, setSelectedErp] = useState<'sap' | 'oracle' | 'dynamics'>('sap');
  const [format, setFormat] = useState<'json' | 'xml' | 'csv'>('json');
  const [syncing, setSyncing] = useState(false);

  if (!parts || parts.length === 0) {
    return (
      <div className={`rounded-2xl p-12 text-center border shadow-sm space-y-4 font-sans ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400 inline-block">
          <Database className="w-10 h-10" />
        </div>
        <h2 className={`text-xl font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>No Parts for ERP Synchronization</h2>
        <p className={`text-xs max-w-md mx-auto font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          The part master catalog is currently empty. Create or import mechanical products to generate ERP integration payloads.
        </p>
      </div>
    );
  }

  const samplePart = parts[0];

  const jsonPayload = JSON.stringify({
    system: selectedErp.toUpperCase(),
    syncTimestamp: new Date().toISOString(),
    itemMaster: {
      materialNumber: samplePart.partNumber,
      description: samplePart.name,
      revision: samplePart.currentRev,
      plantCode: 'PLANT-1001-STUTTGART',
      unitCostUSD: samplePart.estimatedCost,
      weightKg: samplePart.weightKg,
      bomLineItemsCount: 8
    }
  }, null, 2);

  const xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>
<ERPMessage system="${selectedErp.toUpperCase()}">
  <Header timestamp="${new Date().toISOString()}"/>
  <MaterialMaster>
    <MaterialNumber>${samplePart.partNumber}</MaterialNumber>
    <Description>${samplePart.name}</Description>
    <Revision>${samplePart.currentRev}</Revision>
    <UnitCost currency="USD">${samplePart.estimatedCost}</UnitCost>
  </MaterialMaster>
</ERPMessage>`;

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 1200);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className={`rounded-[18px] p-6 border shadow-sm flex items-center justify-between transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className={`p-3 rounded-2xl text-indigo-500 border ${
            isDark ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'
          }`}>
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight flex items-center space-x-2 ${
              isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
            }`}>
              <span>Enterprise ERP Connector Studio</span>
              <span className="badge-status badge-active text-[10px]">
                Bi-Directional API Sync
              </span>
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Synchronize BOM structures, routings, and inventory item masters with SAP S/4HANA, Oracle Fusion, and Microsoft Dynamics.
            </p>
          </div>
        </div>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="btn-primary btn-sm inline-flex items-center space-x-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Syncing Payload...' : 'Trigger ERP Sync'}</span>
        </button>
      </div>

      {/* Target ERP Connector Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div
          onClick={() => setSelectedErp('sap')}
          className={`rounded-2xl p-4 border flex items-center justify-between cursor-pointer transition-all ${
            selectedErp === 'sap'
              ? isDark ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300 shadow-sm' : 'bg-indigo-50 border-indigo-500 text-indigo-800 shadow-sm'
              : isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
          }`}
        >
          <div>
            <div className={`font-bold text-sm ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>SAP S/4HANA Enterprise</div>
            <div className={`text-[10px] mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>REST / OData API v4</div>
          </div>
          <CheckCircle2 className={`w-5 h-5 ${selectedErp === 'sap' ? 'text-indigo-500' : isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`} />
        </div>

        <div
          onClick={() => setSelectedErp('oracle')}
          className={`rounded-2xl p-4 border flex items-center justify-between cursor-pointer transition-all ${
            selectedErp === 'oracle'
              ? isDark ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300 shadow-sm' : 'bg-indigo-50 border-indigo-500 text-indigo-800 shadow-sm'
              : isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
          }`}
        >
          <div>
            <div className={`font-bold text-sm ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>Oracle Fusion Cloud PLM</div>
            <div className={`text-[10px] mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>WebServices SOAP/JSON</div>
          </div>
          <CheckCircle2 className={`w-5 h-5 ${selectedErp === 'oracle' ? 'text-indigo-500' : isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`} />
        </div>

        <div
          onClick={() => setSelectedErp('dynamics')}
          className={`rounded-2xl p-4 border flex items-center justify-between cursor-pointer transition-all ${
            selectedErp === 'dynamics'
              ? isDark ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300 shadow-sm' : 'bg-indigo-50 border-indigo-500 text-indigo-800 shadow-sm'
              : isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
          }`}
        >
          <div>
            <div className={`font-bold text-sm ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>Microsoft Dynamics 365</div>
            <div className={`text-[10px] mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>Azure Service Bus Payload</div>
          </div>
          <CheckCircle2 className={`w-5 h-5 ${selectedErp === 'dynamics' ? 'text-indigo-500' : isDark ? 'text-[#64748B]' : 'text-[#94A3B8]'}`} />
        </div>
      </div>

      {/* Live Payload Viewer */}
      <div className={`rounded-2xl p-5 border shadow-sm space-y-3 text-xs ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className={`flex items-center justify-between border-b pb-3 ${
          isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
        }`}>
          <div className="flex items-center space-x-2">
            <Code className="w-4 h-4 text-cyan-500" />
            <h3 className={`text-sm font-bold ${isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'}`}>Live API Payload Previewer</h3>
          </div>

          <div className={`flex items-center p-1 rounded-lg border space-x-1 ${
            isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
          }`}>
            <button
              onClick={() => setFormat('json')}
              className={`px-3 py-1 rounded text-[10px] font-bold cursor-pointer ${format === 'json' ? 'btn-primary' : 'text-secondary hover:text-primary'}`}
            >
              JSON
            </button>
            <button
              onClick={() => setFormat('xml')}
              className={`px-3 py-1 rounded text-[10px] font-bold cursor-pointer ${format === 'xml' ? 'btn-primary' : 'text-secondary hover:text-primary'}`}
            >
              XML
            </button>
          </div>
        </div>

        <pre className={`p-4 rounded-xl border font-mono text-[11px] overflow-x-auto ${
          isDark ? 'bg-[#0D1628] border-[#243149] text-cyan-300' : 'bg-[#F8FAFC] border-[#E2E8F0] text-cyan-700'
        }`}>
          {format === 'json' ? jsonPayload : xmlPayload}
        </pre>
      </div>
    </div>
  );
};

