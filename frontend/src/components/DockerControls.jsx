import { useState, useEffect } from 'react';
import { Play, Square, RotateCw } from 'lucide-react';
import api from '../services/api';

export default function DockerControls({ vmid }) {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasDocker, setHasDocker] = useState(false);

  const loadContainers = async () => {
    try {
      setError(null);
      const response = await api.getDockerContainers(vmid);
      
      if (response.success && response.data) {
        setContainers(response.data);
        setHasDocker(true);
      } else {
        setHasDocker(false);
      }
    } catch (error) {
      console.error('Erreur chargement conteneurs:', error);
      setHasDocker(false);
      setError(null); // Ne pas afficher d'erreur si Docker n'est pas dispo
    }
  };

  useEffect(() => {
    loadContainers();
    const interval = setInterval(loadContainers, 5000);
    return () => clearInterval(interval);
  }, [vmid]);

  const handleAction = async (action, containerId, containerName) => {
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
      setError(`Erreur lors de l'action ${action} sur ${containerName}`);
    } finally {
      setLoading(false);
    }
  };

  // Ne rien afficher si Docker n'est pas disponible
  if (!hasDocker) {
    return null;
  }

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

      {/* Liste des conteneurs */}
      <div className="space-y-2">
        {containers.length === 0 ? (
          <div className="text-gray-500 text-xs text-center py-2">
            Aucun conteneur Docker
          </div>
        ) : (
          containers.map(container => {
            const containerName = container.Names[0].replace('/', '');
            const isRunning = container.State === 'running';
            
            return (
              <div key={container.Id} className="bg-gray-700/50 rounded p-2 hover:bg-gray-700/70 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {containerName}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {container.Image}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        isRunning
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
                    {!isRunning && (
                      <button
                        onClick={() => handleAction('start', container.Id, containerName)}
                        disabled={loading}
                        className="p-1.5 bg-green-600 hover:bg-green-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Démarrer"
                      >
                        <Play size={14} />
                      </button>
                    )}
                    
                    {isRunning && (
                      <button
                        onClick={() => handleAction('stop', container.Id, containerName)}
                        disabled={loading}
                        className="p-1.5 bg-red-600 hover:bg-red-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Arrêter"
                      >
                        <Square size={14} />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleAction('restart', container.Id, containerName)}
                      disabled={loading}
                      className="p-1.5 bg-yellow-600 hover:bg-yellow-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Redémarrer"
                    >
                      <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
