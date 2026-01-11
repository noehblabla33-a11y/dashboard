# Proxmox Dashboard - Backend

Backend Node.js/Express pour piloter un serveur Proxmox.

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Copier et configurer les variables d'environnement
cp .env.example .env
# Puis éditer .env avec vos informations Proxmox
```

## ⚙️ Configuration

Éditer le fichier `.env` :

```env
PROXMOX_HOST=192.168.1.100        # IP de votre serveur Proxmox
PROXMOX_PORT=8006                 # Port (8006 par défaut)
PROXMOX_USER=root@pam             # Utilisateur Proxmox
PROXMOX_PASSWORD=votre_password   # Mot de passe

PORT=3000                         # Port du serveur Express
NODE_ENV=development
```

## 🏃 Lancement

```bash
# Mode développement (redémarre automatiquement)
npm run dev

# Mode production
npm start
```

Le serveur sera accessible sur `http://localhost:3000`

## 📡 API Endpoints

### Nodes
- `GET /api/nodes` - Liste des nodes Proxmox
- `GET /api/nodes/:node/status` - Statut d'un node (CPU, RAM, réseau...)
- `GET /api/nodes/:node/resources` - VMs et LXC d'un node

### Gestion VMs/LXC
- `POST /api/vms/:vmid/start` - Démarrer une VM/LXC
- `POST /api/vms/:vmid/stop` - Arrêter une VM/LXC
- `POST /api/vms/:vmid/reboot` - Redémarrer une VM/LXC

**Body pour les actions VM/LXC :**
```json
{
  "node": "pve",
  "type": "qemu"  // ou "lxc"
}
```

## 🧪 Test rapide

Une fois le serveur lancé :

```bash
# Tester la connexion
curl http://localhost:3000

# Lister les nodes
curl http://localhost:3000/api/nodes

# Statut d'un node
curl http://localhost:3000/api/nodes/pve/status
```

## 📁 Structure

```
backend/
├── server.js              # Point d'entrée Express
├── routes/
│   └── proxmox.js        # Routes API
├── services/
│   └── proxmoxClient.js  # Client API Proxmox
├── .env                  # Configuration (à créer)
├── .env.example          # Template de configuration
└── package.json
```

## 🔒 Sécurité

⚠️ **Important pour la production :**
- Ne jamais commiter le fichier `.env`
- Utiliser des tokens API plutôt que le password root
- Activer HTTPS même en local
- Restreindre CORS aux origines autorisées

## 📝 Notes

- Le client ignore les certificats SSL auto-signés (normal pour Proxmox local)
- L'authentification se fait automatiquement via ticket PVE
- Le token est réutilisé entre les requêtes
