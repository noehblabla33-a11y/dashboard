import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import proxmoxRoutes from './routes/proxmox.js';

// Charger les variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: 'http://localhost:5173', // URL par défaut de Vite
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging simple des requêtes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Proxmox Dashboard API',
    version: '1.0.0',
    endpoints: {
      nodes: '/api/nodes',
      nodeStatus: '/api/nodes/:node/status',
      resources: '/api/nodes/:node/resources',
      startVM: 'POST /api/vms/:vmid/start',
      stopVM: 'POST /api/vms/:vmid/stop',
      rebootVM: 'POST /api/vms/:vmid/reboot'
    }
  });
});

app.use('/api', proxmoxRoutes);

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route non trouvée' 
  });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Erreur interne du serveur' 
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📊 Dashboard Proxmox Backend v1.0.0`);
  console.log(`🔧 Environnement: ${process.env.NODE_ENV || 'development'}`);
});
