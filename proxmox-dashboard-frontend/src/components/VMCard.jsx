import { useState } from 'react';
import { Play, Square, RotateCw, Server, Container } from 'lucide-react';
import { startVM, stopVM, rebootVM } from '../services/api';

const VMCard = ({ vm, node, onActionComplete }) => {
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState(null);

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

  return (
    <div className="relative group">
      {/* Glow effect externe - couleur selon le type */}
      <div className={`absolute -inset-1 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500 ${
        isLXC 
          ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20' 
          : 'bg-gradient-to-br from-green-500/20 to-emerald-500/20'
      }`}></div>
      
      {/* Card content */}
      <div className="relative bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90 rounded-2xl p-6 shadow-2xl border border-slate-700/50 backdrop-blur-sm hover:border-slate-600/50 transition-all duration-300 hover:transform hover:-translate-y-1">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            {/* Icon avec glow */}
            <div className="relative">
              <div className={`absolute inset-0 rounded-xl blur-md transition-all duration-300 ${
                isLXC ? 'bg-purple-500/30' : 'bg-green-500/30'
              }`}></div>
              <div className={`relative p-2.5 rounded-xl border backdrop-blur-sm ${
                isLXC 
                  ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-400/30' 
                  : 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-400/30'
              }`}>
                {isLXC ? (
                  <Container className="w-6 h-6 text-purple-400" />
                ) : (
                  <Server className="w-6 h-6 text-green-400" />
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-bold text-lg">{vm.name || `VM ${vm.vmid}`}</h3>
              <p className="text-slate-400 text-sm font-medium">
                {isLXC ? 'Container' : 'Virtual Machine'} <span className="text-slate-500">#{vm.vmid}</span>
              </p>
            </div>
          </div>
          
          {/* Status badge */}
          <div className="relative">
            <span className={`relative px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border backdrop-blur-sm ${
              isRunning
                ? 'bg-green-500/20 text-green-300 border-green-500/30 shadow-lg shadow-green-500/20'
                : 'bg-slate-600/30 text-slate-400 border-slate-600/30'
            }`}>
              {isRunning ? '● Online' : '○ Offline'}
            </span>
          </div>
        </div>

        {/* Stats - seulement si en ligne */}
        {isRunning && (
          <div className="grid grid-cols-2 gap-3 mb-5">
            {/* CPU Stat */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl p-3 border border-slate-600/30 backdrop-blur-sm">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">CPU</p>
                <p className="text-white font-bold text-lg">
                  {vm.cpu ? `${(vm.cpu * 100).toFixed(1)}%` : 'N/A'}
                </p>
              </div>
            </div>
            
            {/* RAM Stat */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl p-3 border border-slate-600/30 backdrop-blur-sm">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">RAM</p>
                <p className="text-white font-bold text-lg">
                  {vm.mem && vm.maxmem
                    ? `${((vm.mem / vm.maxmem) * 100).toFixed(0)}%`
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {!isRunning ? (
            <button
              onClick={() => handleAction('start')}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:from-green-800 disabled:to-green-900 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-green-500/25 border border-green-500/30"
            >
              {loading && actionType === 'start' ? (
                <RotateCw className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              Démarrer
            </button>
          ) : (
            <>
              <button
                onClick={() => handleAction('reboot')}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-blue-800 disabled:to-blue-900 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-blue-500/25 border border-blue-500/30"
              >
                {loading && actionType === 'reboot' ? (
                  <RotateCw className="w-5 h-5 animate-spin" />
                ) : (
                  <RotateCw className="w-5 h-5" />
                )}
                Reboot
              </button>
              <button
                onClick={() => handleAction('stop')}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-red-800 disabled:to-red-900 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-red-500/25 border border-red-500/30"
              >
                {loading && actionType === 'stop' ? (
                  <RotateCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
                Arrêter
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VMCard;
