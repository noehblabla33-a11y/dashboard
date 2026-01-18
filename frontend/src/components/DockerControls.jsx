import { useState, useEffect } from 'react';
import { Play, Square, RotateCw, Download } from 'lucide-react';
import { getDockerContainers, startDockerContainer, stopDockerContainer, restartDockerContainer, pullDockerImage } from '../services/api';

export default function DockerControls({ vmid }) {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pullImageName, setPullImageName] = useState('');

  const loadContainers = async () => {
    try {
      const response = await getDockerContainers(vmid);
      setContainers(response.data);
    } catch (error) {
      console.error('Erreur chargement conteneurs:', error);
    }
  };

  useEffect(() => {
    loadContainers();
    const interval = setInterval(loadContainers, 5000);
    return () => clearInterval(interval);
  }, [vmid]);

  const handleAction = async (action, containerId) => {
    setLoading(true);
    try {
      if (action === 'start') await startDockerContainer(vmid, containerId);
      if (action === 'stop') await stopDockerContainer(vmid, containerId);
      if (action === 'restart') await restartDockerContainer(vmid, containerId);
      
      setTimeout(loadContainers, 2000);
    } catch (error) {
      console.error('Erreur action Docker:', error);
    }
    setLoading(false);
  };

  const handlePull = async () => {
    if (!pullImageName) return;
    setLoading(true);
    try {
      await pullDockerImage(vmid, pullImageName);
      setPullImageName('');
      alert(`Pull de ${pullImageName} démarré !`);
    } catch (error) {
      console.error('Erreur pull:', error);
    }
    setLoading(false);
  };

  return (
    <div className="mt-4 space-y-3 border-t border-gray-700 pt-4">
      <h4 className="text-sm font-semibold text-blue-400 flex items-center gap-2">
        🐳 Docker Containers
      </h4>

      {/* Pull d'image */}
      <div className="flex gap-2">
        <input
          type="text"
          value={pullImageName}
          onChange={(e) => setPullImageName(e.target.value)}
          placeholder="image:tag"
          className="flex-1 bg-gray-700 text-white px-3 py-1 rounded text-sm"
        />
        <button
          onClick={handlePull}
          disabled={loading || !pullImageName}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1 disabled:opacity-50"
        >
          <Download size={14} /> Pull
        </button>
      </div>

      {/* Liste des conteneurs */}
      <div className="space-y-2">
        {containers.map(container => (
          <div key={container.Id} className="bg-gray-700/50 rounded p-2">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-white">
                  {container.Names[0].replace('/', '')}
                </div>
                <div className="text-xs text-gray-400">
                  {container.Image} • {container.State}
                </div>
              </div>
              
              <div className="flex gap-1">
                {container.State !== 'running' && (
                  <button
                    onClick={() => handleAction('start', container.Id)}
                    disabled={loading}
                    className="p-1 bg-green-600 hover:bg-green-700 rounded disabled:opacity-50"
                    title="Démarrer"
                  >
                    <Play size={14} />
                  </button>
                )}
                
                {container.State === 'running' && (
                  <button
                    onClick={() => handleAction('stop', container.Id)}
                    disabled={loading}
                    className="p-1 bg-red-600 hover:bg-red-700 rounded disabled:opacity-50"
                    title="Arrêter"
                  >
                    <Square size={14} />
                  </button>
                )}
                
                <button
                  onClick={() => handleAction('restart', container.Id)}
                  disabled={loading}
                  className="p-1 bg-yellow-600 hover:bg-yellow-700 rounded disabled:opacity-50"
                  title="Redémarrer"
                >
                  <RotateCw size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
