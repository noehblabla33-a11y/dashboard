import { useState } from 'react';
import { Play, Square, RotateCw, Server, Container, RefreshCw } from 'lucide-react';
import { startVM, stopVM, rebootVM } from '../services/api';

const VMCard = ({ vm, node, onActionComplete }) => {
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [updating, setUpdating] = useState(false);

  const isRunning = vm.status === 'running';
  const type = vm.type || 'qemu';
  const isLXC = type === 'lxc';

  const handleAction = async (action) => {
    setLoading(true);
    setActionType(action);
    
    try {
      if (action === 'start') {
        await startVM(vm.vmid, node, type);
      } else if (action === 'stop') {
        await stopVM(vm.vmid, node, type);
      } else if (action === 'reboot') {
        await rebootVM(vm.vmid, node, type);
      }
      
      // Notifier le parent pour rafraîchir
      if (onActionComplete) {
        setTimeout(() => onActionComplete(), 2000);
      }
    } catch (error) {
      console.error(`Erreur lors de l'action ${action}:`, error);
      alert(`Erreur: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };

  // Nouvelle fonction pour mettre à jour le dashboard (uniquement pour le container 101)
  const handleUpdateDashboard = async () => {
    if (!confirm('⚠️ Voulez-vous vraiment mettre à jour le dashboard ?\n\nCela va :\n- Faire un git pull\n- Rebuilder le projet\n- Redémarrer le service\n\nLe dashboard sera indisponible pendant ~30 secondes.')) {
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/containers/${vm.vmid}/update-dashboard`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Dashboard mis à jour avec succès !\n\nLe service va redémarrer dans quelques secondes.');
        // Recharger la page après 3 secondes pour voir les changements
        setTimeout(() => window.location.reload(), 3000);
      } else {
        alert(`❌ Erreur lors de la mise à jour :\n${data.error}`);
      }
    } catch (error) {
      alert(`❌ Erreur de connexion :\n${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-700 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isLXC ? 'bg-purple-500/20' : 'bg-green-500/20'}`}>
            {isLXC ? (
              <Container className="w-6 h-6 text-purple-400" />
            ) : (
              <Server className="w-6 h-6 text-green-400" />
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">{vm.name || `VM ${vm.vmid}`}</h3>
            <p className="text-slate-400 text-sm">
              {isLXC ? 'LXC' : 'VM'} #{vm.vmid}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              isRunning
                ? 'bg-green-500/20 text-green-400'
                : 'bg-slate-600/50 text-slate-400'
            }`}
          >
            {isRunning ? 'En ligne' : 'Arrêté'}
          </span>
        </div>
      </div>

      {/* Stats */}
      {isRunning && (
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="bg-slate-700/50 rounded p-2">
            <p className="text-slate-400">CPU</p>
            <p className="text-white font-medium">
              {vm.cpu ? `${(vm.cpu * 100).toFixed(1)}%` : 'N/A'}
            </p>
          </div>
          <div className="bg-slate-700/50 rounded p-2">
            <p className="text-slate-400">RAM</p>
            <p className="text-white font-medium">
              {vm.mem && vm.maxmem
                ? `${((vm.mem / vm.maxmem) * 100).toFixed(0)}%`
                : 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {!isRunning ? (
          <button
            onClick={() => handleAction('start')}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {loading && actionType === 'start' ? (
              <RotateCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Démarrer
          </button>
        ) : (
          <>
            <button
              onClick={() => handleAction('reboot')}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {loading && actionType === 'reboot' ? (
                <RotateCw className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCw className="w-4 h-4" />
              )}
              Redémarrer
            </button>
            <button
              onClick={() => handleAction('stop')}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {loading && actionType === 'stop' ? (
                <RotateCw className="w-4 h-4 animate-spin" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              Arrêter
            </button>
          </>
        )}
      </div>

      {/* Bouton de mise à jour du dashboard (uniquement pour le container 101) */}
      {vm.vmid === 101 && (
        <button
          onClick={handleUpdateDashboard}
          disabled={updating}
          className="w-full mt-3 py-2 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
          {updating ? 'Mise à jour en cours...' : '🚀 Mettre à jour le Dashboard'}
        </button>
      )}
    </div>
  );
};

export default VMCard;
