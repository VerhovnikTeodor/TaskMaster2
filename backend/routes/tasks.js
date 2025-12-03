const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { tasks, projects, users } = require('../data/store');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Vsi route-i zahtevajo avtentikacijo
router.use(authenticateToken);

const TASK_STATUS = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE'
};

// Pridobi vse naloge za projekt
router.get('/project/:projectId', (req, res) => {
  const { projectId } = req.params;

  const project = projects.find(p => p.id === projectId);
  
  if (!project) {
    return res.status(404).json({ error: 'Projekt ne obstaja' });
  }

  // Preveri dostop
  if (project.ownerId !== req.user.id && !project.members.includes(req.user.id)) {
    return res.status(403).json({ error: 'Nimate dostopa do tega projekta' });
  }

  const projectTasks = tasks.filter(t => t.projectId === projectId);
  
  // Dodaj informacije o dodeljenem uporabniku
  const tasksWithAssignee = projectTasks.map(task => {
    if (task.assignedTo) {
      const assignee = users.find(u => u.id === task.assignedTo);
      return {
        ...task,
        assignee: assignee ? {
          id: assignee.id,
          firstName: assignee.firstName,
          lastName: assignee.lastName,
          email: assignee.email
        } : null
      };
    }
    return task;
  });

  res.json(tasksWithAssignee);
});

// Pridobi posamezno nalogo
router.get('/:id', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);

  if (!task) {
    return res.status(404).json({ error: 'Naloga ne obstaja' });
  }

  const project = projects.find(p => p.id === task.projectId);
  
  // Preveri dostop do projekta
  if (project.ownerId !== req.user.id && !project.members.includes(req.user.id)) {
    return res.status(403).json({ error: 'Nimate dostopa do te naloge' });
  }

  // Dodaj informacije o dodeljenem uporabniku
  if (task.assignedTo) {
    const assignee = users.find(u => u.id === task.assignedTo);
    task.assignee = assignee ? {
      id: assignee.id,
      firstName: assignee.firstName,
      lastName: assignee.lastName,
      email: assignee.email
    } : null;
  }

  res.json(task);
});

// Ustvari novo nalogo
router.post('/', (req, res) => {
  const { title, description, projectId, assignedTo, priority } = req.body;

  if (!title || !projectId) {
    return res.status(400).json({ error: 'Naslov in ID projekta sta obvezna' });
  }

  const project = projects.find(p => p.id === projectId);
  
  if (!project) {
    return res.status(404).json({ error: 'Projekt ne obstaja' });
  }

  // Preveri dostop
  if (project.ownerId !== req.user.id && !project.members.includes(req.user.id)) {
    return res.status(403).json({ error: 'Nimate dostopa do tega projekta' });
  }

  // Če je navedena dodeljenja oseba, preveri če je član projekta
  if (assignedTo && !project.members.includes(assignedTo)) {
    return res.status(400).json({ error: 'Dodeljena oseba mora biti član projekta' });
  }

  const newTask = {
    id: uuidv4(),
    title,
    description: description || '',
    projectId,
    assignedTo: assignedTo || null,
    status: TASK_STATUS.TODO,
    priority: priority || 'medium',
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  tasks.push(newTask);

  res.status(201).json(newTask);
});

// Posodobi nalogo
router.put('/:id', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);

  if (!task) {
    return res.status(404).json({ error: 'Naloga ne obstaja' });
  }

  const project = projects.find(p => p.id === task.projectId);
  
  // Preveri dostop
  if (project.ownerId !== req.user.id && !project.members.includes(req.user.id)) {
    return res.status(403).json({ error: 'Nimate dostopa do te naloge' });
  }

  const { title, description, status, assignedTo, priority } = req.body;

  // Preveri status
  if (status && !Object.values(TASK_STATUS).includes(status)) {
    return res.status(400).json({ error: 'Neveljaven status naloge' });
  }

  // Če je navedena dodeljenja oseba, preveri če je član projekta
  if (assignedTo && !project.members.includes(assignedTo)) {
    return res.status(400).json({ error: 'Dodeljena oseba mora biti član projekta' });
  }

  if (title) task.title = title;
  if (description !== undefined) task.description = description;
  if (status) task.status = status;
  if (assignedTo !== undefined) task.assignedTo = assignedTo;
  if (priority) task.priority = priority;
  task.updatedAt = new Date().toISOString();

  res.json(task);
});

// Izbriši nalogo
router.delete('/:id', (req, res) => {
  const taskIndex = tasks.findIndex(t => t.id === req.params.id);

  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Naloga ne obstaja' });
  }

  const task = tasks[taskIndex];
  const project = projects.find(p => p.id === task.projectId);
  
  // Samo lastnik projekta ali ustvarjalec naloge lahko izbriše nalogo
  if (project.ownerId !== req.user.id && task.createdBy !== req.user.id) {
    return res.status(403).json({ error: 'Nimate dovoljenja za brisanje te naloge' });
  }

  tasks.splice(taskIndex, 1);

  res.json({ message: 'Naloga uspešno izbrisana' });
});

// Pridobi moje naloge
router.get('/my/tasks', (req, res) => {
  const myTasks = tasks.filter(t => t.assignedTo === req.user.id);
  
  // Dodaj informacije o projektu
  const tasksWithProject = myTasks.map(task => {
    const project = projects.find(p => p.id === task.projectId);
    return {
      ...task,
      project: project ? {
        id: project.id,
        name: project.name
      } : null
    };
  });

  res.json(tasksWithProject);
});

module.exports = router;
