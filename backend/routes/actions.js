import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const router = express.Router();
const execAsync = promisify(exec);

// Configuration du LXC Ansible
const ANSIBLE_LXC = {
  host: '192.168.1.61',
  user: 'ansible',
  sshKey: '/home/dashboard/.ssh/id_rsa',
  ansibleDir: '/home/ansible/ansible-playbooks',
  inventoryFile: 'inventory.ini',
  playbookFile: 'deploy.yml'
};

// Liste des services déployables via Ansible (mapping VMID → nom service dans inventory)
const DEPLOYABLE_SERVICES = {
  '101': 'dashboard',
  '110': 'frigo'
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
    console.log('Lancement de la mise à jour du dashboard...');
    
    // Exécuter le script de mise à jour
    const { stdout, stderr } = await execAsync('/root/scripts/update-dashboard.sh');
    
    console.log('Script exécuté avec succès');
    
    res.json({ 
      success: true, 
      message: 'Dashboard mis à jour avec succès',
      output: stdout,
      stderr: stderr
    });
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    
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
  
  console.log('🔍 [DEBUG] Service name trouvé:', serviceName);
  console.log('🔍 [DEBUG] DEPLOYABLE_SERVICES:', DEPLOYABLE_SERVICES);
  
  if (!serviceName) {
    console.log('❌ [DEBUG] Service non configuré');
    return res.status(403).json({ 
      success: false, 
      error: `Le container ${id} n'est pas configuré pour le déploiement Ansible` 
    });
  }

  try {
    console.log('🔧 [DEBUG] Configuration ANSIBLE_LXC:');
    console.log('   - Host:', ANSIBLE_LXC.host);
    console.log('   - User:', ANSIBLE_LXC.user);
    console.log('   - SSH Key:', ANSIBLE_LXC.sshKey);
    console.log('   - Ansible Dir:', ANSIBLE_LXC.ansibleDir);
    
    console.log('📡 [DEBUG] Connexion au LXC Ansible:', `${ANSIBLE_LXC.user}@${ANSIBLE_LXC.host}`);
    
    // Construire la commande SSH qui exécute Ansible sur le LXC
    const ansibleCommand = `cd ${ANSIBLE_LXC.ansibleDir} && ansible-playbook -i ${ANSIBLE_LXC.inventoryFile} ${ANSIBLE_LXC.playbookFile} --limit ${serviceName}`;
    
    const sshCommand = `ssh -i ${ANSIBLE_LXC.sshKey} -o StrictHostKeyChecking=no ${ANSIBLE_LXC.user}@${ANSIBLE_LXC.host} "${ansibleCommand}"`;
    
    console.log('🔍 [DEBUG] Commande SSH complète:', sshCommand);
    console.log('⏳ [DEBUG] Exécution en cours...');
    
    // Exécuter le playbook Ansible via SSH avec un timeout de 15 minutes
    const { stdout, stderr } = await execAsync(sshCommand, {
      timeout: 900000, // 15 minutes en millisecondes
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer pour les gros outputs
    });
    
    console.log('✅ [DEBUG] Déploiement Ansible terminé avec succès');
    console.log('📄 [DEBUG] Output (premiers 500 caractères):', stdout.substring(0, 500));
    if (stderr) {
      console.log('⚠️  [DEBUG] Stderr:', stderr);
    }
    
    console.log('📤 [DEBUG] Envoi de la réponse au client...');
    
    res.json({ 
      success: true, 
      message: `Service "${serviceName}" déployé avec succès`,
      serviceName: serviceName,
      output: stdout,
      stderr: stderr
    });
    
    console.log('✅ [DEBUG] Réponse envoyée avec succès');
    
  } catch (error) {
    console.error('═══════════════════════════════════════════════════════');
    console.error('❌ [DEBUG] ERREUR lors du déploiement Ansible');
    console.error('═══════════════════════════════════════════════════════');
    console.error('❌ [DEBUG] Type:', error.constructor.name);
    console.error('❌ [DEBUG] Message:', error.message);
    console.error('❌ [DEBUG] Code:', error.code);
    console.error('❌ [DEBUG] Stack:', error.stack);
    
    if (error.stdout) {
      console.error('📄 [DEBUG] Stdout:', error.stdout);
    }
    if (error.stderr) {
      console.error('📄 [DEBUG] Stderr:', error.stderr);
    }
    
    // Parser l'erreur pour donner plus de détails
    let errorMessage = error.message;
    if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Le déploiement a dépassé le délai maximum (15 minutes)';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = `Impossible de se connecter au LXC Ansible (${ANSIBLE_LXC.host})`;
    }
    
    console.error('📤 [DEBUG] Envoi de l\'erreur au client...');
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage,
      serviceName: serviceName,
      output: error.stdout || '',
      stderr: error.stderr || ''
    });
    
    console.error('✅ [DEBUG] Erreur envoyée au client');
  }
});

// Route pour obtenir la liste des services déployables
router.get('/ansible/services', async (req, res) => {
  console.log('[DEBUG] Route /ansible/services appelée');
  res.json({
    success: true,
    data: DEPLOYABLE_SERVICES
  });
});

// Route pour tester la connexion au LXC Ansible
router.get('/ansible/test-connection', async (req, res) => {
  console.log('🔍 [DEBUG] Route /ansible/test-connection appelée');
  
  try {
    const testCommand = `ssh -i ${ANSIBLE_LXC.sshKey} -o StrictHostKeyChecking=no -o ConnectTimeout=5 ${ANSIBLE_LXC.user}@${ANSIBLE_LXC.host} "echo 'Connection OK' && ansible --version"`;
    
    console.log('[DEBUG] Commande test:', testCommand);
    
    const { stdout, stderr } = await execAsync(testCommand, {
      timeout: 10000
    });
    
    console.log('✅ [DEBUG] Test connexion réussi');
    
    res.json({
      success: true,
      message: 'Connexion au LXC Ansible réussie',
      ansibleVersion: stdout,
      lxcHost: ANSIBLE_LXC.host,
      user: ANSIBLE_LXC.user
    });
  } catch (error) {
    console.error('[DEBUG] Test connexion échoué:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      lxcHost: ANSIBLE_LXC.host,
      user: ANSIBLE_LXC.user
    });
  }
});

export default router;
