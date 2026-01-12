import { useEffect, useState } from 'react';
import { Cpu, HardDrive, Network } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ icon: Icon, label, value, unit, trend }) => (
  <div className="relative group overflow-hidden rounded-2xl">
    {/* Glow effect - maintenant avec z-index correct */}
    <div className="absolute -inset-1 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10"></div>
    
    {/* Card content */}
    <div className="relative bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90 rounded-2xl p-6 shadow-2xl border border-slate-700/50 backdrop-blur-sm hover:border-slate-600/50 transition-all duration-300 hover:transform hover:-translate-y-1">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/30 rounded-lg blur-md group-hover:blur-lg transition-all duration-300"></div>
            <div className="relative p-2.5 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg border border-blue-400/20">
              <Icon className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <h3 className="text-slate-300 font-semibold text-sm uppercase tracking-wider">{label}</h3>
        </div>
      </div>
      
      <div className="mb-4">
        <span className="text-4xl font-bold bg-gradient-to-br from-white to-slate-300 bg-clip-text text-transparent">
          {value}
        </span>
        <span className="text-xl text-slate-400 ml-1 font-medium">{unit}</span>
      </div>
      
      {trend && (
        <div className="h-16 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent rounded-lg"></div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity="1" />
                </linearGradient>
              </defs>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="url(#lineGradient)" 
                strokeWidth={2.5} 
                dot={false}
                filter="drop-shadow(0 0 6px rgba(59, 130, 246, 0.5))"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {/* Decorative corner */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-tr-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  </div>
);

const ServerStats = ({ nodeStatus }) => {
  const [cpuTrend, setCpuTrend] = useState([]);
  const [memTrend, setMemTrend] = useState([]);

  useEffect(() => {
    if (!nodeStatus) return;

    const cpuPercent = ((nodeStatus.cpu || 0) * 100).toFixed(1);
    const memPercent = ((nodeStatus.memory?.used || 0) / (nodeStatus.memory?.total || 1) * 100).toFixed(1);

    // Mise à jour des tendances (garde les 20 dernières valeurs)
    setCpuTrend(prev => [...prev.slice(-19), { value: parseFloat(cpuPercent), time: Date.now() }]);
    setMemTrend(prev => [...prev.slice(-19), { value: parseFloat(memPercent), time: Date.now() }]);
  }, [nodeStatus]);

  if (!nodeStatus) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-700">
        <p className="text-slate-400">Chargement des statistiques...</p>
      </div>
    );
  }

  const cpuPercent = ((nodeStatus.cpu || 0) * 100).toFixed(1);
  const memUsed = ((nodeStatus.memory?.used || 0) / (1024 ** 3)).toFixed(1);
  const memTotal = ((nodeStatus.memory?.total || 0) / (1024 ** 3)).toFixed(1);
  const memPercent = ((nodeStatus.memory?.used || 0) / (nodeStatus.memory?.total || 1) * 100).toFixed(1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <StatCard
        icon={Cpu}
        label="CPU"
        value={cpuPercent}
        unit="%"
        trend={cpuTrend}
      />
      <StatCard
        icon={HardDrive}
        label="RAM"
        value={`${memUsed}/${memTotal}`}
        unit=" GB"
        trend={memTrend}
      />
      <StatCard
        icon={Network}
        label="Utilisation"
        value={memPercent}
        unit="%"
      />
    </div>
  );
};

export default ServerStats;
