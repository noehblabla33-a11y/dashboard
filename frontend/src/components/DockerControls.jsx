import { useState, useEffect } from 'react';
import { Play, Square, RotateCw, Download } from 'lucide-react';
import api from '../services/api';

export default function DockerControls({ vmid }) {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pullImageName, setPullImageName] = useState('');
  const [error, setError] = useState(null);

  const loadContainers = async () => {
    try {
      setError(null);
      const response = await api.getDockerContainers(vmid);
      if (response.success) {
        setContainers(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement conteneurs:', error);
      setError('Impossible de charger les conteneurs');
    }
  };

  useEffect(() => {
    loadContainers();
    const interval = setInterval(loadContainers, 5000);
    return () => clearInterval(interval);
  }, [vmid]);

  const handleAction = async (action, containerId) => {
    setLoading(true);
    setError(null);
    
    try {
      if (action === 'start') {
        await api.startDockerContainer(vmid, containerId);
      } else if (action === 'stop') {
        await api.stopDockerContainer(vmid, containerId);
      } else if (action === 'restart') {
        await api.restartDockerContainer(vmid, containerId);
      }
      
      // Recharger les conteneurs après l'action
      setTimeout(loadContainers, 2000);
    } catch (error) {
      console.error('Erreur action Docker:', error);
      setError(`Erreur lors de l'action ${action}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePull = async () => {
    if (!pullImageName) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await api.pullDockerImage(vmid, pullImageName);
      setPullImageName('');
      alert(`Pull de ${pullImageName} démarré ! Cela peut prendre quelques minutes...`);
    } catch (error) {
      console.error('Erreur pull:', error);
      setError('Erreur lors du pull de l\'image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 space-y-3 border-t border-gray-700 pt-4">
      <h4 className="text-sm font-semibold text-blue-400 flex items-center gap-2">
        🐳 Docker Containers
      </h4>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded p-2 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Pull d'image */}
      <div className="flex gap-2">
        <input
          type="text"
          value={pullImageName}
          onChange={(e) => setPullImageName(e.target.value)}
          placeholder="image:tag (ex: nginx:latest)"
          className="flex-1 bg-gray-700 text-white px-3 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handlePull}
          disabled={loading || !pullImageName}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download size={14} /> Pull
        </button>
      </div>

      {/* Liste des conteneurs */}
      <div className="space-y-2">
        {containers.length === 0 ? (
          <div className="text-gray-500 text-xs text-center py-2">
            Aucun conteneur Docker
          </div>
        ) : (
          containers.map(container => (
            <div key={container.Id} className="bg-gray-700/50 rounded p-2 hover:bg-gray-700/70 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {container.Names[0].replace('/', '')}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {container.Image}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      container.State === 'running' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-gray-600/50 text-gray-400'
                    }`}>
                      {container.State}
                    </span>
                    {container.Status && (
                      <span className="text-xs text-gray-500 truncate">
                        {container.Status}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-1 ml-2">
                  {container.State !== 'running' && (
                    <button
                      onClick={() => handleAction('start', container.Id)}
                      disabled={loading}
                      className="p-1.5 bg-green-600 hover:bg-green-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Démarrer"
                    >
                      <Play size={14} />
                    </button>
                  )}
                  
                  {container.State === 'running' && (
                    <button
                      onClick={() => handleAction('stop', container.Id)}
                      disabled={loading}
                      className="p-1.5 bg-red-600 hover:bg-red-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Arrêter"
                    >
                      <Square size={14} />
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleAction('restart', container.Id)}
                    disabled={loading}
                    className="p-1.5 bg-yellow-600 hover:bg-yellow-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Redémarrer"
                  >
                    <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
