import express from 'express';
import proxmoxClient from '../services/proxmoxClient.js';

const router = express.Router();

// GET /api/nodes - Liste des nodes Proxmox
router.get('/nodes', async (req, res) => {
  try {
    const nodes = await proxmoxClient.getNodes();
    res.json({ success: true, data: nodes });
  } catch (error) {
    console.error('Erreur récupération nodes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/nodes/:node/status - Statut d'un node (CPU, RAM, etc.)
router.get('/nodes/:node/status', async (req, res) => {
  try {
    const status = await proxmoxClient.getNodeStatus(req.params.node);
    res.json({ success: true, data: status });
  } catch (error) {
    console.error('Erreur récupération statut node:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/nodes/:node/resources - VMs et LXC d'un node
router.get('/nodes/:node/resources', async (req, res) => {
  try {
    const resources = await proxmoxClient.getResources(req.params.node);
    res.json({ success: true, data: resources });
  } catch (error) {
    console.error('Erreur récupération resources:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/vms/:vmid/start - Démarrer une VM
router.post('/vms/:vmid/start', async (req, res) => {
  try {
    const { node, type } = req.body; // type: 'qemu' ou 'lxc'
    
    let result;
    if (type === 'lxc') {
      result = await proxmoxClient.startLXC(node, req.params.vmid);
    } else {
      result = await proxmoxClient.startVM(node, req.params.vmid);
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Erreur démarrage VM/LXC:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/vms/:vmid/stop - Arrêter une VM
router.post('/vms/:vmid/stop', async (req, res) => {
  try {
    const { node, type } = req.body;
    
    let result;
    if (type === 'lxc') {
      result = await proxmoxClient.stopLXC(node, req.params.vmid);
    } else {
      result = await proxmoxClient.stopVM(node, req.params.vmid);
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Erreur arrêt VM/LXC:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/vms/:vmid/reboot - Redémarrer une VM
router.post('/vms/:vmid/reboot', async (req, res) => {
  try {
    const { node, type } = req.body;
    
    let result;
    if (type === 'lxc') {
      result = await proxmoxClient.rebootLXC(node, req.params.vmid);
    } else {
      result = await proxmoxClient.rebootVM(node, req.params.vmid);
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Erreur redémarrage VM/LXC:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
