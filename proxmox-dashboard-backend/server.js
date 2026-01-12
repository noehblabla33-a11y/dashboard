import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import proxmoxRoutes from './routes/proxmox.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Pour obtenir __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 80;

// Middlewares
app.use(cors()); // CORS simplifié (tout est sur le même domaine maintenant)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging simple des requêtes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ⚠️ IMPORTANT : Routes API AVANT le static
app.use('/api', proxmoxRoutes);

// Servir le frontend statique depuis dist
const frontendPath = path.join(__dirname, '../proxmox-dashboard-frontend/dist');
app.use(express.static(frontendPath));

// Fallback pour React Router - DOIT être après les routes API
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Dashboard Proxmox sur http://0.0.0.0:${PORT}`);
  console.log(`📊 Frontend + Backend unifiés (ALL-IN-ONE)`);
  console.log(`🔧 Environnement: ${process.env.NODE_ENV || 'production'}`);
});
