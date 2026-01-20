import axios from 'axios';
import https from 'https';

class DockerClient {
  constructor() {
    // Configuration pour chaque LXC avec Docker
    this.dockerHosts = {
      '104': { ip: '192.168.1.11', port: 2375 },
      '105': { ip: '192.168.1.25', port: 2375 },
      '106': { ip: '192.168.1.15', port: 2375 },
      '107': { ip: '192.168.1.30', port: 2375},
      '108': { ip: '192.168.1.35', port: 2378},
    };
  }

  // Construire l'URL Docker pour un LXC donné
  getDockerUrl(vmid) {
    const host = this.dockerHosts[vmid];
    if (!host) return null;
    return `http://${host.ip}:${host.port}`;
  }

  // Vérifier si le LXC a Docker activé
  hasDocker(vmid) {
    return !!this.dockerHosts[vmid];
  }

  // Lister les conteneurs
  async listContainers(vmid) {
    const baseUrl = this.getDockerUrl(vmid);
    if (!baseUrl) throw new Error('Docker non configuré pour ce LXC');

    const response = await axios.get(`${baseUrl}/containers/json?all=true`);
    return response.data;
  }

  // Pull une image
  async pullImage(vmid, imageName) {
    const baseUrl = this.getDockerUrl(vmid);
    if (!baseUrl) throw new Error('Docker non configuré pour ce LXC');

    const response = await axios.post(
      `${baseUrl}/images/create?fromImage=${imageName}`,
      {},
      { timeout: 300000 } // 5 min timeout pour le pull
    );
    return response.data;
  }

  // Démarrer un conteneur
  async startContainer(vmid, containerId) {
    const baseUrl = this.getDockerUrl(vmid);
    if (!baseUrl) throw new Error('Docker non configuré pour ce LXC');

    await axios.post(`${baseUrl}/containers/${containerId}/start`);
    return { success: true };
  }

  // Arrêter un conteneur
  async stopContainer(vmid, containerId) {
    const baseUrl = this.getDockerUrl(vmid);
    if (!baseUrl) throw new Error('Docker non configuré pour ce LXC');

    await axios.post(`${baseUrl}/containers/${containerId}/stop`);
    return { success: true };
  }

  // Redémarrer un conteneur
  async restartContainer(vmid, containerId) {
    const baseUrl = this.getDockerUrl(vmid);
    if (!baseUrl) throw new Error('Docker non configuré pour ce LXC');

    await axios.post(`${baseUrl}/containers/${containerId}/restart`);
    return { success: true };
  }
}

export default new DockerClient();
