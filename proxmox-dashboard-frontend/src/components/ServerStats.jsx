import { useEffect, useState } from 'react';
import { Cpu, HardDrive, Network, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ icon: Icon, label, value, unit, trend }) => (
  <div className="bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-700">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Icon className="w-6 h-6 text-blue-400" />
        </div>
        <h3 className="text-slate-300 font-medium text-sm">{label}</h3>
      </div>
    </div>
    <div className="mb-4">
      <span className="text-3xl font-bold text-white">
        {value}
      </span>
      <span className="text-lg text-slate-400 ml-1">{unit}</span>
    </div>
    {trend && (
      <div className="h-16">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend}>
            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )}
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
  const uptime = Math.floor((nodeStatus.uptime || 0) / 86400);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
      <StatCard
        icon={Activity}
        label="Uptime"
        value={uptime}
        unit=" jours"
      />
    </div>
  );
};

export default ServerStats;
