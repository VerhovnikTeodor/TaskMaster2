const express = require('express');
const repo = require('../data/repository');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

async function enrichProject(project) {
  if (!project) return null;
  const memberDetails = await repo.getProjectMembers(project.id);
  return {
    ...project,
    memberDetails,
  };
}

// Pridobi vse projekte uporabnika
router.get('/', async (req, res) => {
  try {
    const userProjects = await repo.getUserProjects(req.user.id);
    const enriched = await Promise.all(userProjects.map(enrichProject));
    res.json(enriched);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Napaka pri pridobivanju projektov' });
  }
});

// Pridobi posamezen projekt
router.get('/:id', async (req, res) => {
  try {
    const project = await repo.findProjectById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Projekt ne obstaja' });
    }

    if (project.ownerId !== req.user.id && !project.members.includes(req.user.id)) {
      return res.status(403).json({ error: 'Nimate dostopa do tega projekta' });
    }

    res.json(await enrichProject(project));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Napaka pri pridobivanju projekta' });
  }
});

// Ustvari nov projekt
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Ime projekta je obvezno' });
    }

    const newProject = await repo.createProject({
      name,
      description,
      ownerId: req.user.id,
    });

    res.status(201).json(await enrichProject(newProject));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Napaka pri ustvarjanju projekta' });
  }
});

// Posodobi projekt
router.put('/:id', async (req, res) => {
  try {
    const project = await repo.findProjectById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Projekt ne obstaja' });
    }

    if (project.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Samo lastnik lahko ureja projekt' });
    }

    const { name, description } = req.body;
    const updated = await repo.updateProject(req.params.id, { name, description });
    res.json(await enrichProject(updated));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Napaka pri posodobitvi projekta' });
  }
});

// Izbriši projekt
router.delete('/:id', async (req, res) => {
  try {
    const project = await repo.findProjectById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Projekt ne obstaja' });
    }

    if (project.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Samo lastnik lahko izbriše projekt' });
    }

    await repo.deleteProject(req.params.id);
    res.json({ message: 'Projekt uspešno izbrisan' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Napaka pri brisanju projekta' });
  }
});

// Dodaj člana v projekt
router.post('/:id/members', async (req, res) => {
  try {
    const project = await repo.findProjectById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Projekt ne obstaja' });
    }

    if (project.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Samo lastnik lahko dodaja člane' });
    }

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'ID uporabnika je obvezen' });
    }

    const user = await repo.findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Uporabnik ne obstaja' });
    }

    if (project.members.includes(userId)) {
      return res.status(400).json({ error: 'Uporabnik je že član projekta' });
    }

    const updated = await repo.addProjectMember(req.params.id, userId);
    res.json(await enrichProject(updated));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Napaka pri dodajanju člana' });
  }
});

// Odstrani člana iz projekta
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const project = await repo.findProjectById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Projekt ne obstaja' });
    }

    if (project.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Samo lastnik lahko odstrani člane' });
    }

    const { userId } = req.params;

    if (userId === project.ownerId) {
      return res.status(400).json({ error: 'Ne morete odstraniti lastnika projekta' });
    }

    if (!project.members.includes(userId)) {
      return res.status(404).json({ error: 'Uporabnik ni član projekta' });
    }

    const updated = await repo.removeProjectMember(req.params.id, userId);
    res.json(await enrichProject(updated));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Napaka pri odstranjevanju člana' });
  }
});

module.exports = router;
