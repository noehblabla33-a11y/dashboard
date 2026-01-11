import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

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

export default api;
