const express = require('express');
const repo = require('../data/repository');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

const TASK_STATUS = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
};

async function ensureProjectAccess(projectId, userId) {
  const project = await repo.findProjectById(projectId);
  if (!project) {
    return { error: { status: 404, message: 'Projekt ne obstaja' } };
  }
  if (project.ownerId !== userId && !project.members.includes(userId)) {
    return { error: { status: 403, message: 'Nimate dostopa do tega projekta' } };
  }
  return { project };
}

// Pridobi moje naloge (mora biti pred /:id)
router.get('/my/tasks', async (req, res) => {
  try {
    const myTasks = await repo.getMyTasks(req.user.id);
    res.json(myTasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Napaka pri pridobivanju nalog' });
  }
});

// Pridobi vse naloge za projekt
router.get('/project/:projectId', async (req, res) => {
  try {
    const access = await ensureProjectAccess(req.params.projectId, req.user.id);
    if (access.error) {
      return res.status(access.error.status).json({ error: access.error.message });
    }

    const projectTasks = await repo.getProjectTasks(req.params.projectId);
    res.json(projectTasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Napaka pri pridobivanju nalog' });
  }
});

// Pridobi posamezno nalogo
router.get('/:id', async (req, res) => {
  try {
    const task = await repo.findTaskById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Naloga ne obstaja' });
    }

    const access = await ensureProjectAccess(task.projectId, req.user.id);
    if (access.error) {
      return res.status(access.error.status).json({ error: access.error.message });
    }

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Napaka pri pridobivanju naloge' });
  }
});

// Ustvari novo nalogo
router.post('/', async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, priority, dueDate } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ error: 'Naslov in ID projekta sta obvezna' });
    }

    const access = await ensureProjectAccess(projectId, req.user.id);
    if (access.error) {
      return res.status(access.error.status).json({ error: access.error.message });
    }

    if (assignedTo && !access.project.members.includes(assignedTo)) {
      return res.status(400).json({ error: 'Dodeljena oseba mora biti član projekta' });
    }

    const newTask = await repo.createTask({
      title,
      description,
      projectId,
      assignedTo,
      priority,
      dueDate: dueDate || null,
      createdBy: req.user.id,
    });

    res.status(201).json(newTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Napaka pri ustvarjanju naloge' });
  }
});

// Posodobi nalogo
router.put('/:id', async (req, res) => {
  try {
    const task = await repo.findTaskById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Naloga ne obstaja' });
    }

    const access = await ensureProjectAccess(task.projectId, req.user.id);
    if (access.error) {
      return res.status(access.error.status).json({ error: access.error.message });
    }

    const { title, description, status, assignedTo, priority, dueDate } = req.body;

    if (status && !Object.values(TASK_STATUS).includes(status)) {
      return res.status(400).json({ error: 'Neveljaven status naloge' });
    }

    if (assignedTo && !access.project.members.includes(assignedTo)) {
      return res.status(400).json({ error: 'Dodeljena oseba mora biti član projekta' });
    }

    const updated = await repo.updateTask(req.params.id, {
      title,
      description,
      status,
      assignedTo,
      priority,
      dueDate,
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Napaka pri posodobitvi naloge' });
  }
});

// Izbriši nalogo
router.delete('/:id', async (req, res) => {
  try {
    const task = await repo.findTaskById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Naloga ne obstaja' });
    }

    const project = await repo.findProjectById(task.projectId);

    if (project.ownerId !== req.user.id && task.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Nimate dovoljenja za brisanje te naloge' });
    }

    await repo.deleteTask(req.params.id);
    res.json({ message: 'Naloga uspešno izbrisana' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Napaka pri brisanju naloge' });
  }
});

module.exports = router;
