import axios from 'axios';

// URL relative - pas besoin de .env ni d'IP
const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Nodes
export const getNodes = async () => {
  const response = await api.get('/nodes');
  return response.data;
};

export const getNodeStatus = async (node) => {
  const response = await api.get(`/nodes/${node}/status`);
  return response.data;
};

export const getNodeResources = async (node) => {
  const response = await api.get(`/nodes/${node}/resources`);
  return response.data;
};

// VM/LXC Actions
export const startVM = async (vmid, node, type) => {
  const response = await api.post(`/vms/${vmid}/start`, { node, type });
  return response.data;
};

export const stopVM = async (vmid, node, type) => {
  const response = await api.post(`/vms/${vmid}/stop`, { node, type });
  return response.data;
};

export const rebootVM = async (vmid, node, type) => {
  const response = await api.post(`/vms/${vmid}/reboot`, { node, type });
  return response.data;
};

// Fonction helper pour les actions VM/LXC
export const controlVM = async (node, vmid, action, isLXC) => {
  const type = isLXC ? 'lxc' : 'qemu';
  
  switch(action) {
    case 'start':
      return await startVM(vmid, node, type);
    case 'stop':
      return await stopVM(vmid, node, type);
    case 'reboot':
      return await rebootVM(vmid, node, type);
    default:
      throw new Error(`Action inconnue: ${action}`);
  }
};

// Mise à jour du dashboard (ancienne méthode)
export const updateDashboard = async (node, vmid) => {
  const response = await api.post(`/containers/${vmid}/update-dashboard`);
  return response.data;
};

// Nouvelle fonction: Déploiement Ansible
export const ansibleDeploy = async (vmid) => {
  const response = await api.post(`/containers/${vmid}/ansible-deploy`);
  return response.data;
};

// Récupérer la liste des services déployables
export const getDeployableServices = async () => {
  const response = await api.get('/ansible/services');
  return response.data;
};

// Export par défaut
export default {
  getNodes,
  getNodeStatus,
  getNodeResources,
  startVM,
  stopVM,
  rebootVM,
  controlVM,
  updateDashboard,
  ansibleDeploy,
  getDeployableServices
};
