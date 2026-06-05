import React, { useState, useEffect } from 'react';
import { Cloud, Database, Activity, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Navbar: React.FC = () => {
  const { user } = useAuth();
  const [latency, setLatency] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);
  const [mockIp] = useState(() => {
    // Generate a realistic AWS Private IP inside VPC subnet (172.31.x.x)
    const thirdOctet = Math.floor(Math.random() * 254) + 1;
    const fourthOctet = Math.floor(Math.random() * 254) + 1;
    return `172.31.${thirdOctet}.${fourthOctet}`;
  });

  const checkLatency = async () => {
    setChecking(true);
    const start = performance.now();
    try {
      await api.get('/health');
      const end = performance.now();
      setLatency(Math.round(end - start));
    } catch (err) {
      setLatency(null);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkLatency();
    const interval = setInterval(checkLatency, 30000); // check every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10 w-full">
      {/* Page Context (empty or spacing placeholder) */}
      <div className="flex items-center gap-2">
        <span className="text-xs bg-indigo-500/10 text-indigo-400 font-semibold px-2.5 py-1 rounded-full border border-indigo-500/20">
          VPC Sandbox Mode
        </span>
      </div>

      {/* Cloud Networking Stats Dashboard */}
      <div className="flex items-center gap-6 text-xs text-slate-400">
        {/* Latency */}
        <div className="flex items-center gap-1.5 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Latency:</span>
          <span className="font-mono text-emerald-400 font-bold">
            {latency !== null ? `${latency}ms` : 'Offline'}
          </span>
          <button 
            onClick={checkLatency} 
            disabled={checking}
            className="ml-1 hover:text-indigo-400 disabled:opacity-50"
            title="Refresh network latency"
          >
            <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Mock EC2 instance IP */}
        <div className="flex items-center gap-1.5 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800">
          <Cloud className="w-3.5 h-3.5 text-sky-400" />
          <span>EC2 Private IP:</span>
          <span className="font-mono text-sky-400 font-bold">{mockIp}</span>
        </div>

        {/* Database connection status */}
        <div className="flex items-center gap-1.5 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800">
          <Database className="w-3.5 h-3.5 text-amber-400" />
          <span>RDS Database:</span>
          <span className="text-slate-200 font-semibold">Active (AWS-RDS-MultiAZ)</span>
        </div>

        {/* User Details */}
        <div className="flex items-center gap-2 pl-4 border-l border-slate-800">
          <span className="text-slate-300 font-medium">{user?.name}</span>
          <span className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded text-[10px] font-bold uppercase tracking-wider">
            {user?.role}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
