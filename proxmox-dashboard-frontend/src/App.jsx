import { useState, useEffect } from 'react';
import { Server, Cpu, HardDrive, Network } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import VMCard from './components/VMCard';
import { getNodes, getNodeStatus, getNodeResources } from './services/api';
import './index.css';

function App() {
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeStatus, setNodeStatus] = useState(null);
  const [resources, setResources] = useState({ vms: [], containers: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cpuTrend, setCpuTrend] = useState([]);
  const [memTrend, setMemTrend] = useState([]);

  // Charger les nodes au démarrage
  useEffect(() => {
    loadNodes();
  }, []);

  // Auto-refresh toutes les 5 secondes
  useEffect(() => {
    if (!selectedNode) return;

    const interval = setInterval(() => {
      loadNodeData(selectedNode, true);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedNode]);

  const loadNodes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getNodes();
      
      if (response.success && response.data.length > 0) {
        setNodes(response.data);
        const firstNode = response.data[0].node;
        setSelectedNode(firstNode);
        await loadNodeData(firstNode);
      }
    } catch (err) {
      setError('Impossible de se connecter au serveur Proxmox');
      console.error('Erreur chargement nodes:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadNodeData = async (nodeName, silent = false) => {
    try {
      const [statusResponse, resourcesResponse] = await Promise.all([
        getNodeStatus(nodeName),
        getNodeResources(nodeName)
      ]);

      if (statusResponse.success) {
        setNodeStatus(statusResponse.data);
        
        // Mise à jour des tendances
        const cpuPercent = ((statusResponse.data.cpu || 0) * 100).toFixed(1);
        const memPercent = ((statusResponse.data.memory?.used || 0) / (statusResponse.data.memory?.total || 1) * 100).toFixed(1);
        
        setCpuTrend(prev => [...prev.slice(-19), { value: parseFloat(cpuPercent), time: Date.now() }]);
        setMemTrend(prev => [...prev.slice(-19), { value: parseFloat(memPercent), time: Date.now() }]);
      }

      if (resourcesResponse.success) {
        setResources(resourcesResponse.data);
      }
    } catch (err) {
      console.error('Erreur chargement données node:', err);
      if (!silent) {
        setError('Erreur lors du chargement des données');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 mb-4">
            <p className="text-red-400 text-lg font-medium">{error}</p>
          </div>
          <button
            onClick={loadNodes}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const allResources = [
    ...resources.vms.map(vm => ({ ...vm, type: 'qemu' })),
    ...resources.containers.map(ct => ({ ...ct, type: 'lxc' }))
  ].sort((a, b) => a.vmid - b.vmid);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="relative bg-gradient-to-br from-slate-800 via-slate-800/95 to-slate-900 border-b border-slate-700/50 shadow-2xl backdrop-blur-xl">
        {/* Animated background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-green-500/5 animate-gradient-shift"></div>
        
        {/* Glowing top border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
        
        <div className="container mx-auto px-6 py-4 relative z-10">
          <div className="flex items-center gap-6">
            {/* Left side - Logo and title */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="relative group">
                {/* Glow effect behind icon */}
                <div className="absolute inset-0 bg-blue-500/30 rounded-xl blur-xl group-hover:bg-blue-500/50 transition-all duration-300"></div>
                <div className="relative p-2.5 bg-gradient-to-br from-blue-500/20 to-blue-600/30 rounded-xl border border-blue-400/30 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                  <Server className="w-7 h-7 text-blue-400 group-hover:text-blue-300 transition-colors" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                  Proxmox Dashboard
                </h1>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                  <p className="text-slate-400 text-xs font-medium">
                    Node: <span className="text-blue-300">{selectedNode || 'N/A'}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Row - flex-grow pour prendre l'espace disponible */}
            {nodeStatus && (
              <div className="flex items-center gap-3 flex-grow">
                {/* CPU Stat */}
                <div className="relative group overflow-hidden flex-1">
                  <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                  <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-3 border border-slate-700/50 backdrop-blur-sm overflow-hidden">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-blue-500/20 rounded-lg">
                          <Cpu className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                        <span className="text-slate-300 text-xs font-semibold uppercase tracking-wider">CPU</span>
                      </div>
                      <span className="text-xl font-bold text-white">
                        {((nodeStatus.cpu || 0) * 100).toFixed(1)}<span className="text-xs text-slate-400 ml-1">%</span>
                      </span>
                    </div>
                    <div className="h-10 overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={cpuTrend}>
                          <defs>
                            <linearGradient id="cpuGradient" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
                              <stop offset="100%" stopColor="#60a5fa" stopOpacity="1" />
                            </linearGradient>
                          </defs>
                          <Line type="monotone" dataKey="value" stroke="url(#cpuGradient)" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* RAM Stat */}
                <div className="relative group overflow-hidden flex-1">
                  <div className="absolute -inset-0.5 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                  <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-3 border border-slate-700/50 backdrop-blur-sm overflow-hidden">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-purple-500/20 rounded-lg">
                          <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                        </div>
                        <span className="text-slate-300 text-xs font-semibold uppercase tracking-wider">RAM</span>
                      </div>
                      <span className="text-xl font-bold text-white">
                        {((nodeStatus.memory?.used || 0) / (nodeStatus.memory?.total || 1) * 100).toFixed(1)}<span className="text-xs text-slate-400 ml-1">%</span>
                      </span>
                    </div>
                    <div className="h-10 overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={memTrend}>
                          <defs>
                            <linearGradient id="ramGradient" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.5" />
                              <stop offset="100%" stopColor="#ec4899" stopOpacity="1" />
                            </linearGradient>
                          </defs>
                          <Line type="monotone" dataKey="value" stroke="url(#ramGradient)" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Network Stat */}
                <div className="relative group overflow-hidden flex-1">
                  <div className="absolute -inset-0.5 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                  <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-3 border border-slate-700/50 backdrop-blur-sm overflow-hidden">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-emerald-500/20 rounded-lg">
                          <Network className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <span className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Network</span>
                      </div>
                      <span className="text-xl font-bold text-white">
                        {((nodeStatus.memory?.used || 0) / (1024 ** 3)).toFixed(1)}<span className="text-xs text-slate-400 ml-1">GB</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                      <div>
                        <span className="text-emerald-400 font-semibold">↑</span> 0 MB/s
                      </div>
                      <div>
                        <span className="text-blue-400 font-semibold">↓</span> 0 MB/s
                      </div>
                      <div className="text-slate-500">
                        {((nodeStatus.memory?.total || 0) / (1024 ** 3)).toFixed(1)} GB
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Right side - Uptime Badge */}
            {nodeStatus && (
              <div className="relative group flex-shrink-0">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                
                {/* Badge content - version compacte */}
                <div className="relative flex items-center gap-3 bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-green-600/10 border border-green-500/30 rounded-xl px-4 py-3 backdrop-blur-md uptime-badge">
                  {/* Status indicator */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
                      <div className="absolute inset-0 bg-green-400 rounded-full animate-pulse"></div>
                      <div className="relative w-2 h-2 bg-green-500 rounded-full shadow-lg shadow-green-500/50"></div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-green-300/70 text-[10px] font-semibold uppercase tracking-wider">System</span>
                      <span className="text-green-200 text-xs font-bold">Online</span>
                    </div>
                  </div>
                  
                  {/* Separator with gradient */}
                  <div className="h-10 w-px bg-gradient-to-b from-transparent via-green-500/50 to-transparent"></div>
                  
                  {/* Uptime display */}
                  <div className="flex flex-col items-end">
                    <span className="text-green-300/70 text-[10px] font-semibold uppercase tracking-wider">Uptime</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold bg-gradient-to-br from-green-300 to-emerald-400 bg-clip-text text-transparent">
                        {Math.floor((nodeStatus.uptime || 0) / 86400)}
                      </span>
                      <span className="text-xs text-green-400/80 font-medium">jours</span>
                    </div>
                  </div>
                  
                  {/* Animated border */}
                  <div className="absolute inset-0 rounded-xl border-2 border-green-400/0 group-hover:border-green-400/30 transition-all duration-300"></div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Bottom glow */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">

        {/* VMs & Containers Section */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mb-1">
              Machines Virtuelles & Conteneurs
            </h2>
            <div className="flex items-center gap-2">
              <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              <p className="text-slate-400 text-sm font-medium">
                {allResources.length} ressource{allResources.length > 1 ? 's' : ''} active{allResources.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {allResources.length === 0 ? (
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-700/20 to-slate-800/20 rounded-2xl blur-xl"></div>
            <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-12 text-center border border-slate-700/50 backdrop-blur-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center">
                <Server className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-400 text-lg font-medium">Aucune VM ou conteneur trouvé</p>
              <p className="text-slate-500 text-sm mt-2">Les ressources apparaîtront ici une fois créées</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allResources.map((resource) => (
              <VMCard
                key={`${resource.type}-${resource.vmid}`}
                vm={resource}
                node={selectedNode}
                onActionComplete={() => loadNodeData(selectedNode, true)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative bg-gradient-to-br from-slate-800/80 via-slate-800/70 to-slate-900/80 border-t border-slate-700/50 mt-12 backdrop-blur-sm">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
        <div className="container mx-auto px-6 py-6 text-center">
          <p className="text-slate-400 text-sm font-medium">
            Proxmox Dashboard - <span className="text-slate-500">Projet personnel</span>
          </p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-slate-500 text-xs">System monitoring active</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
