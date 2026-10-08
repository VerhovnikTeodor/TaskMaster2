const express = require('express');
const repo = require('../data/repository');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// Pridobi dashboard statistiko
router.get('/stats', async (req, res) => {
  try {
    const stats = await repo.getDashboardStats(req.user.id);
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Napaka pri pridobivanju statistike' });
  }
});

// Pridobi pregled aktivnosti po projektih
router.get('/project-overview', async (req, res) => {
  try {
    const overview = await repo.getProjectOverview(req.user.id);
    res.json(overview);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Napaka pri pridobivanju pregleda projektov' });
  }
});

module.exports = router;
