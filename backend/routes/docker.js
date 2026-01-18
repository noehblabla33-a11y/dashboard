import express from 'express';
import dockerClient from '../services/dockerClient.js';

const router = express.Router();

// GET /api/docker/:vmid/containers - Liste des conteneurs
router.get('/:vmid/containers', async (req, res) => {
  try {
    const containers = await dockerClient.listContainers(req.params.vmid);
    res.json({ success: true, data: containers });
  } catch (error) {
    console.error('Erreur liste conteneurs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/docker/:vmid/pull - Pull une image
router.post('/:vmid/pull', async (req, res) => {
  try {
    const { imageName } = req.body;
    await dockerClient.pullImage(req.params.vmid, imageName);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur pull image:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/docker/:vmid/containers/:containerId/start
router.post('/:vmid/containers/:containerId/start', async (req, res) => {
  try {
    await dockerClient.startContainer(req.params.vmid, req.params.containerId);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur démarrage conteneur:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/docker/:vmid/containers/:containerId/stop
router.post('/:vmid/containers/:containerId/stop', async (req, res) => {
  try {
    await dockerClient.stopContainer(req.params.vmid, req.params.containerId);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur arrêt conteneur:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/docker/:vmid/containers/:containerId/restart
router.post('/:vmid/containers/:containerId/restart', async (req, res) => {
  try {
    await dockerClient.restartContainer(req.params.vmid, req.params.containerId);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur redémarrage conteneur:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
