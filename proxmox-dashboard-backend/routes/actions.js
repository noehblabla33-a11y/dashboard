import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const router = express.Router();
const execAsync = promisify(exec);

// Route pour mettre à jour le dashboard
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

export default router;
