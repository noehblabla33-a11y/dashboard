import axios from 'axios';
import https from 'https';

class ProxmoxClient {
  constructor() {
    this.host = process.env.PROXMOX_HOST;
    this.port = process.env.PROXMOX_PORT || 8006;
    this.username = process.env.PROXMOX_USER;
    this.password = process.env.PROXMOX_PASSWORD;
    this.baseUrl = `https://${this.host}:${this.port}/api2/json`;
    this.ticket = null;
    this.csrfToken = null;

    // Agent HTTPS qui ignore les certificats auto-signés (OK pour usage local)
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false
    });
  }

  // Authentification auprès de Proxmox
  async authenticate() {
    try {
      const response = await axios.post(
        `${this.baseUrl}/access/ticket`,
        `username=${encodeURIComponent(this.username)}&password=${encodeURIComponent(this.password)}`,
        {
          httpsAgent: this.httpsAgent,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.ticket = response.data.data.ticket;
      this.csrfToken = response.data.data.CSRFPreventionToken;
      
      console.log('✅ Authentification Proxmox réussie');
      return true;
    } catch (error) {
      console.error('❌ Erreur authentification Proxmox:', error.message);
      throw new Error('Impossible de se connecter à Proxmox');
    }
  }

  // Requête générique vers l'API Proxmox
  async request(method, endpoint, data = null) {
    // S'authentifier si pas encore fait
    if (!this.ticket) {
      await this.authenticate();
    }

    try {
      const config = {
        method,
        url: `${this.baseUrl}${endpoint}`,
        httpsAgent: this.httpsAgent,
        headers: {
          'Cookie': `PVEAuthCookie=${this.ticket}`,
          'CSRFPreventionToken': this.csrfToken
        }
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data.data;
    } catch (error) {
      // Si erreur 401, réessayer avec nouvelle authentification
      if (error.response?.status === 401) {
        this.ticket = null;
        return this.request(method, endpoint, data);
      }
      throw error;
    }
  }

  // Récupérer la liste des nodes
  async getNodes() {
    return await this.request('GET', '/nodes');
  }

  // Récupérer toutes les VMs et LXC d'un node
  async getResources(node) {
    const qemu = await this.request('GET', `/nodes/${node}/qemu`);
    const lxc = await this.request('GET', `/nodes/${node}/lxc`);
    
    return {
      vms: qemu,
      containers: lxc
    };
  }

  // Récupérer le statut d'un node (CPU, RAM, etc.)
  async getNodeStatus(node) {
    return await this.request('GET', `/nodes/${node}/status`);
  }

  // Démarrer une VM
  async startVM(node, vmid) {
    return await this.request('POST', `/nodes/${node}/qemu/${vmid}/status/start`);
  }

  // Arrêter une VM
  async stopVM(node, vmid) {
    return await this.request('POST', `/nodes/${node}/qemu/${vmid}/status/stop`);
  }

  // Redémarrer une VM
  async rebootVM(node, vmid) {
    return await this.request('POST', `/nodes/${node}/qemu/${vmid}/status/reboot`);
  }

  // Démarrer un LXC
  async startLXC(node, vmid) {
    return await this.request('POST', `/nodes/${node}/lxc/${vmid}/status/start`);
  }

  // Arrêter un LXC
  async stopLXC(node, vmid) {
    return await this.request('POST', `/nodes/${node}/lxc/${vmid}/status/stop`);
  }

  // Redémarrer un LXC
  async rebootLXC(node, vmid) {
    return await this.request('POST', `/nodes/${node}/lxc/${vmid}/status/reboot`);
  }
}

// Export une instance unique (singleton)
export default new ProxmoxClient();
