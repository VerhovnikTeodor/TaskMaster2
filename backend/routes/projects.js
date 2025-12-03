const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { projects, users } = require('../data/store');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Vsi route-i zahtevajo avtentikacijo
router.use(authenticateToken);

// Pridobi vse projekte uporabnika
router.get('/', (req, res) => {
  const userProjects = projects.filter(p => 
    p.ownerId === req.user.id || p.members.includes(req.user.id)
  );
  
  res.json(userProjects);
});

// Pridobi posamezen projekt
router.get('/:id', (req, res) => {
  const project = projects.find(p => p.id === req.params.id);
  
  if (!project) {
    return res.status(404).json({ error: 'Projekt ne obstaja' });
  }

  // Preveri dostop
  if (project.ownerId !== req.user.id && !project.members.includes(req.user.id)) {
    return res.status(403).json({ error: 'Nimate dostopa do tega projekta' });
  }

  res.json(project);
});

// Ustvari nov projekt
router.post('/', (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Ime projekta je obvezno' });
  }

  const newProject = {
    id: uuidv4(),
    name,
    description: description || '',
    ownerId: req.user.id,
    members: [req.user.id],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  projects.push(newProject);

  res.status(201).json(newProject);
});

// Posodobi projekt
router.put('/:id', (req, res) => {
  const project = projects.find(p => p.id === req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Projekt ne obstaja' });
  }

  // Samo lastnik lahko ureja projekt
  if (project.ownerId !== req.user.id) {
    return res.status(403).json({ error: 'Samo lastnik lahko ureja projekt' });
  }

  const { name, description } = req.body;

  if (name) project.name = name;
  if (description !== undefined) project.description = description;
  project.updatedAt = new Date().toISOString();

  res.json(project);
});

// Izbriši projekt
router.delete('/:id', (req, res) => {
  const projectIndex = projects.findIndex(p => p.id === req.params.id);

  if (projectIndex === -1) {
    return res.status(404).json({ error: 'Projekt ne obstaja' });
  }

  const project = projects[projectIndex];

  // Samo lastnik lahko izbriše projekt
  if (project.ownerId !== req.user.id) {
    return res.status(403).json({ error: 'Samo lastnik lahko izbriše projekt' });
  }

  projects.splice(projectIndex, 1);

  res.json({ message: 'Projekt uspešno izbrisan' });
});

// Dodaj člana v projekt
router.post('/:id/members', (req, res) => {
  const project = projects.find(p => p.id === req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Projekt ne obstaja' });
  }

  // Samo lastnik lahko dodaja člane
  if (project.ownerId !== req.user.id) {
    return res.status(403).json({ error: 'Samo lastnik lahko dodaja člane' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'ID uporabnika je obvezen' });
  }

  // Preveri če uporabnik obstaja
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'Uporabnik ne obstaja' });
  }

  // Preveri če je uporabnik že član
  if (project.members.includes(userId)) {
    return res.status(400).json({ error: 'Uporabnik je že član projekta' });
  }

  project.members.push(userId);
  project.updatedAt = new Date().toISOString();

  res.json(project);
});

// Odstrani člana iz projekta
router.delete('/:id/members/:userId', (req, res) => {
  const project = projects.find(p => p.id === req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Projekt ne obstaja' });
  }

  // Samo lastnik lahko odstrani člane
  if (project.ownerId !== req.user.id) {
    return res.status(403).json({ error: 'Samo lastnik lahko odstrani člane' });
  }

  const { userId } = req.params;

  // Ne more odstraniti lastnika
  if (userId === project.ownerId) {
    return res.status(400).json({ error: 'Ne morete odstraniti lastnika projekta' });
  }

  const memberIndex = project.members.indexOf(userId);
  if (memberIndex === -1) {
    return res.status(404).json({ error: 'Uporabnik ni član projekta' });
  }

  project.members.splice(memberIndex, 1);
  project.updatedAt = new Date().toISOString();

  res.json(project);
});

module.exports = router;
