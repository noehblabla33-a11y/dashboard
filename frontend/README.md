# Proxmox Dashboard - Frontend

Interface React moderne pour piloter un serveur Proxmox.

## 🚀 Installation

```bash
# Installer les dépendances
npm install
```

## 🏃 Lancement

```bash
# Mode développement
npm run dev
```

Le frontend sera accessible sur `http://localhost:5173`

## ⚙️ Configuration

Assurez-vous que le backend est lancé sur `http://localhost:3000`

Si vous devez changer l'URL du backend, modifiez `src/services/api.js` :

```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

## ✨ Fonctionnalités

### Dashboard en temps réel
- 📊 Statistiques du serveur (CPU, RAM, Réseau, Uptime)
- 📈 Graphiques de tendance pour CPU et RAM
- 🔄 Auto-refresh toutes les 5 secondes (désactivable)

### Gestion des VMs et LXC
- 📋 Liste de toutes les VMs et conteneurs
- ▶️ Démarrer une VM/LXC
- ⏹️ Arrêter une VM/LXC
- 🔄 Redémarrer une VM/LXC
- 📊 Stats en temps réel (CPU, RAM) pour les ressources actives

### Interface
- 🎨 Design moderne avec Tailwind CSS
- 🌙 Thème sombre
- 📱 Responsive (mobile, tablette, desktop)
- ⚡ Rapide et fluide

## 📁 Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ServerStats.jsx  # Stats serveur avec graphiques
│   │   └── VMCard.jsx        # Carte VM/LXC avec actions
│   ├── services/
│   │   └── api.js            # Appels API vers le backend
│   ├── App.jsx               # Composant principal
│   └── index.css             # Styles globaux (Tailwind)
├── index.html
└── package.json
```

## 🛠️ Technologies

- ⚛️ **React 18** - UI library
- ⚡ **Vite** - Build tool ultra rapide
- 🎨 **Tailwind CSS** - Styling
- 📊 **Recharts** - Graphiques
- 🎯 **Lucide React** - Icônes
- 🌐 **Axios** - HTTP client

## 📝 Notes

- Le frontend interroge le backend toutes les 5 secondes en mode auto-refresh
- Les actions sur les VMs (start/stop/reboot) rafraîchissent automatiquement l'état après 2 secondes
- La distinction visuelle entre VMs (vert) et LXC (violet) facilite l'identification

## 🔧 Développement

Pour builder en production :

```bash
npm run build
```

Les fichiers seront générés dans `dist/`
