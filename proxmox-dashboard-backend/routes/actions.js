import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const router = express.Router();
const execAsync = promisify(exec);

// Configuration du LXC Ansible
const ANSIBLE_LXC = {
  host: '10.0.0.61',  // IP de votre LXC Ansible
  user: 'ansible',        // Utilisateur SSH
  // Utiliser une clé SSH sans mot de passe pour l'authentification
  sshKey: '/root/.ssh/id_rsa',
  ansibleDir: '/home/ansible/ansible-playbooks',  // Dossier ansible dans le LXC
  inventoryFile: 'inventory.ini',
  playbookFile: 'deploy.yml'
};

// Liste des services déployables via Ansible (mapping VMID → nom service dans inventory)
const DEPLOYABLE_SERVICES = {
  '101': 'proxmox-backend',  // Exemple: LXC 101 = service "proxmox-dashboard"
  '110': 'frigo',         // Exemple: LXC 102 = service "web-server"
  // Ajoutez ici les autres services
};

// Route pour mettre à jour le dashboard (ancienne route conservée)
router.post('/containers/:id/update-dashboard', async (req, res) => {
  const { id } = req.params;
  
  // Sécurité : autoriser uniquement le container 101
  if (id !== '101') {
    return res.status(403).json({ 
      success: false, 
      error: 'Cette action n\'est disponible que pour le container 101' 
    });
  }

  try {
    console.log('🔄 Lancement de la mise à jour du dashboard...');
    
    // Exécuter le script de mise à jour
    const { stdout, stderr } = await execAsync('/root/scripts/update-dashboard.sh');
    
    console.log('✅ Script exécuté avec succès');
    
    res.json({ 
      success: true, 
      message: 'Dashboard mis à jour avec succès',
      output: stdout,
      stderr: stderr
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
    
    res.status(500).json({ 
      success: false, 
      error: error.message,
      output: error.stdout,
      stderr: error.stderr
    });
  }
});

// Nouvelle route pour déployer/mettre à jour via Ansible (SSH vers LXC Ansible)
router.post('/containers/:id/ansible-deploy', async (req, res) => {
  const { id } = req.params;
  
  // Vérifier que le container est dans la liste des services déployables
  const serviceName = DEPLOYABLE_SERVICES[id];
  
  if (!serviceName) {
    return res.status(403).json({ 
      success: false, 
      error: `Le container ${id} n'est pas configuré pour le déploiement Ansible` 
    });
  }

  try {
    console.log(`🚀 Déploiement Ansible du service "${serviceName}" (LXC ${id})...`);
    console.log(`📡 Connexion au LXC Ansible: ${ANSIBLE_LXC.user}@${ANSIBLE_LXC.host}`);
    
    // Construire la commande SSH qui exécute Ansible sur le LXC
    const ansibleCommand = `cd ${ANSIBLE_LXC.ansibleDir} && ansible-playbook -i ${ANSIBLE_LXC.inventoryFile} ${ANSIBLE_LXC.playbookFile} --limit ${serviceName}`;
    
    const sshCommand = `ssh -i ${ANSIBLE_LXC.sshKey} -o StrictHostKeyChecking=no ${ANSIBLE_LXC.user}@${ANSIBLE_LXC.host} "${ansibleCommand}"`;
    
    console.log(`Exécution via SSH: ${sshCommand}`);
    
    // Exécuter le playbook Ansible via SSH avec un timeout de 15 minutes
    const { stdout, stderr } = await execAsync(sshCommand, {
      timeout: 900000, // 15 minutes en millisecondes
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer pour les gros outputs
    });
    
    console.log('✅ Déploiement Ansible terminé avec succès');
    console.log('Output:', stdout);
    
    res.json({ 
      success: true, 
      message: `Service "${serviceName}" déployé avec succès`,
      serviceName: serviceName,
      output: stdout,
      stderr: stderr
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du déploiement Ansible:', error);
    
    // Parser l'erreur pour donner plus de détails
    let errorMessage = error.message;
    if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Le déploiement a dépassé le délai maximum (15 minutes)';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = `Impossible de se connecter au LXC Ansible (${ANSIBLE_LXC.host})`;
    }
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage,
      serviceName: serviceName,
      output: error.stdout || '',
      stderr: error.stderr || ''
    });
  }
});

// Route pour obtenir la liste des services déployables
router.get('/ansible/services', async (req, res) => {
  res.json({
    success: true,
    data: DEPLOYABLE_SERVICES
  });
});

// Route pour tester la connexion au LXC Ansible
router.get('/ansible/test-connection', async (req, res) => {
  try {
    const testCommand = `ssh -i ${ANSIBLE_LXC.sshKey} -o StrictHostKeyChecking=no -o ConnectTimeout=5 ${ANSIBLE_LXC.user}@${ANSIBLE_LXC.host} "echo 'Connection OK' && ansible --version"`;
    
    const { stdout, stderr } = await execAsync(testCommand, {
      timeout: 10000
    });
    
    res.json({
      success: true,
      message: 'Connexion au LXC Ansible réussie',
      ansibleVersion: stdout,
      lxcHost: ANSIBLE_LXC.host
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      lxcHost: ANSIBLE_LXC.host
    });
  }
});

export default router;
