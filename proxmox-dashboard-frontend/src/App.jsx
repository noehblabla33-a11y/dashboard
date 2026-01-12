import { useState, useEffect } from 'react';
import { Server } from 'lucide-react';
import ServerStats from './components/ServerStats';
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
      <header className="bg-slate-800 border-b border-slate-700 shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Server className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Proxmox Dashboard</h1>
                <p className="text-slate-400 text-sm">
                  Node: {selectedNode || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Server Stats */}
        <ServerStats nodeStatus={nodeStatus} />

        {/* VMs & Containers */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">
            Machines Virtuelles & Conteneurs ({allResources.length})
          </h2>
        </div>

        {allResources.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-12 text-center border border-slate-700">
            <p className="text-slate-400 text-lg">Aucune VM ou conteneur trouvé</p>
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
      <footer className="bg-slate-800 border-t border-slate-700 mt-12">
        <div className="container mx-auto px-6 py-4 text-center text-slate-400 text-sm">
          Proxmox Dashboard - Projet personnel
        </div>
      </footer>
    </div>
  );
}

export default App;
