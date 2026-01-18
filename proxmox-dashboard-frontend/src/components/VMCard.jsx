import React, { useState, useEffect } from 'react';
import { Play, Square, RotateCw, Server, Container, Rocket } from 'lucide-react';
import api from '../services/api';

const VMCard = ({ vm, node, onActionComplete }) => {
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [deploying, setDeploying] = useState(false);
  const [deployableServices, setDeployableServices] = useState({});

  const isRunning = vm.status === 'running';
  const isLXC = vm.type === 'lxc';

  // Charger la liste des services déployables au montage
  useEffect(() => {
    const loadDeployableServices = async () => {
      try {
        const response = await api.getDeployableServices();
        if (response.success) {
          setDeployableServices(response.data);
        }
      } catch (error) {
        console.error('Erreur chargement services déployables:', error);
      }
    };
    loadDeployableServices();
  }, []);

  const handleAction = async (action) => {
    try {
      setLoading(true);
      setActionType(action);

      await api.controlVM(node, vm.vmid, action, isLXC);

      setTimeout(() => {
        onActionComplete();
        setLoading(false);
        setActionType(null);
      }, 2000);
    } catch (error) {
      console.error(`Erreur ${action}:`, error);
      setLoading(false);
      setActionType(null);
      alert(`Erreur lors de l'action ${action}`);
    }
  };

  const handleAnsibleDeploy = async () => {
    const serviceName = deployableServices[vm.vmid];
    
    // Si c'est le dashboard lui-même (container 101), avertir du redémarrage
    if (vm.vmid === 101) {
      if (!confirm(
        `⚠️ DÉPLOIEMENT DU DASHBOARD ⚠️\n\n` +
        `Vous allez déployer et redémarrer le dashboard lui-même.\n\n` +
        `➡️ Le service va redémarrer\n` +
        `➡️ Vous verrez une erreur réseau temporaire (c'est normal)\n` +
        `➡️ La page se rechargera automatiquement après 40 secondes\n\n` +
        `Continuer ?`
      )) {
        return;
      }
    } else {
      if (!confirm(`Voulez-vous vraiment déployer/mettre à jour le service "${serviceName}" ?`)) {
        return;
      }
    }

    try {
      setDeploying(true);
      
      // Cas spécial : déploiement du dashboard lui-même
      if (vm.vmid === 101) {
        // Lancer le déploiement (on sait qu'il va échouer avec une erreur réseau)
        api.ansibleDeploy(vm.vmid).catch(() => {
          // Ignorer l'erreur réseau, c'est normal car le service redémarre
          console.log('Erreur réseau attendue : le service redémarre');
        });
        
        // Afficher un compteur de rechargement
        let countdown = 40;
        const countdownInterval = setInterval(() => {
          countdown--;
          if (countdown <= 0) {
            clearInterval(countdownInterval);
            window.location.reload();
          }
        }, 1000);
        
        alert(
          `🚀 Déploiement lancé !\n\n` +
          `Le dashboard va redémarrer...\n` +
          `Rechargement automatique dans 40 secondes.\n\n` +
          `Si la page ne se recharge pas, appuyez sur F5.`
        );
        
      } else {
        // Autres services : comportement normal
        const response = await api.ansibleDeploy(vm.vmid);
        
        if (response.success) {
          alert(`✅ Service "${response.serviceName}" déployé avec succès!\n\nDétails:\n${response.output.substring(0, 500)}`);
          // Rafraîchir les données après le déploiement
          setTimeout(() => {
            onActionComplete();
          }, 2000);
        }
      }
    } catch (error) {
      // Seulement afficher l'erreur pour les services autres que 101
      if (vm.vmid !== 101) {
        console.error('Erreur déploiement Ansible:', error);
        const errorMsg = error.response?.data?.error || error.message;
        const errorOutput = error.response?.data?.stderr || '';
        alert(`❌ Erreur lors du déploiement:\n${errorMsg}\n\n${errorOutput}`);
      }
    } finally {
      // Ne pas remettre deploying à false pour le container 101
      // car on va recharger la page de toute façon
      if (vm.vmid !== 101) {
        setDeploying(false);
      }
    }
  };

  const borderColor = isRunning
    ? (isLXC ? 'border-purple-500/50' : 'border-green-500/50')
    : 'border-slate-700';
  
  const glowEffect = isRunning
    ? (isLXC 
        ? 'shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40' 
        : 'shadow-lg shadow-green-500/20 hover:shadow-green-500/40')
    : 'shadow-lg';

  // Vérifier si ce container est déployable via Ansible
  const isDeployable = vm.vmid in deployableServices;

  return (
    <div className={`bg-slate-800 rounded-lg p-3 border-2 ${borderColor} ${glowEffect} hover:border-opacity-100 transition-all duration-300`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isLXC ? 'bg-purple-500/20' : 'bg-green-500/20'}`}>
            {isLXC ? (
              <Container className="w-4 h-4 text-purple-400" />
            ) : (
              <Server className="w-4 h-4 text-green-400" />
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">{vm.name || `VM ${vm.vmid}`}</h3>
            <p className="text-slate-400 text-xs">
              {isLXC ? 'LXC' : 'VM'} #{vm.vmid}
              {isDeployable && <span className="ml-2 text-orange-400">🚀</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              isRunning
                ? 'bg-green-500/20 text-green-400 animate-pulse'
                : 'bg-slate-600/50 text-slate-400'
            }`}
          >
            {isRunning ? '● En ligne' : '○ Arrêté'}
          </span>
        </div>
      </div>

      {/* Stats */}
      {isRunning && (
        <div className="grid grid-cols-2 gap-2 mb-2 text-sm">
          <div className="bg-slate-700/50 rounded p-2 border border-slate-600/50 hover:border-slate-500/50 transition-colors">
            <p className="text-slate-400 text-xs mb-0.5">CPU</p>
            <p className="text-white font-bold text-sm">
              {vm.cpu ? `${(vm.cpu * 100).toFixed(1)}%` : 'N/A'}
            </p>
          </div>
          <div className="bg-slate-700/50 rounded p-2 border border-slate-600/50 hover:border-slate-500/50 transition-colors">
            <p className="text-slate-400 text-xs mb-0.5">RAM</p>
            <p className="text-white font-bold text-sm">
              {vm.mem && vm.maxmem
                ? `${((vm.mem / vm.maxmem) * 100).toFixed(0)}%`
                : 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-1.5">
        {!isRunning ? (
          <button
            onClick={() => handleAction('start')}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
          >
            {loading && actionType === 'start' ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            Démarrer
          </button>
        ) : (
          <>
            <button
              onClick={() => handleAction('reboot')}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
            >
              {loading && actionType === 'reboot' ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RotateCw className="w-3.5 h-3.5" />
              )}
              Redémarrer
            </button>
            <button
              onClick={() => handleAction('stop')}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
            >
              {loading && actionType === 'stop' ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              Arrêter
            </button>
          </>
        )}
      </div>

      {/* Bouton de déploiement Ansible (pour les containers configurés) */}
      {isDeployable && (
        <button
          onClick={handleAnsibleDeploy}
          disabled={deploying}
          className="w-full mt-2 py-1.5 px-3 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 text-sm font-medium shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40"
        >
          <Rocket className={`w-3.5 h-3.5 ${deploying ? 'animate-spin' : ''}`} />
          {deploying ? 'Déploiement...' : `Déployer ${deployableServices[vm.vmid]}`}
        </button>
      )}
    </div>
  );
};

export default VMCard;
