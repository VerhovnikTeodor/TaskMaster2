const express = require('express');
const repo = require('../data/repository');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

async function ensureTaskAccess(taskId, userId) {
  const task = await repo.findTaskById(taskId);
  if (!task) {
    return { error: { status: 404, message: 'Naloga ne obstaja' } };
  }

  const project = await repo.findProjectById(task.projectId);
  if (!project) {
    return { error: { status: 404, message: 'Projekt ne obstaja' } };
  }

  if (project.ownerId !== userId && !project.members.includes(userId)) {
    return { error: { status: 403, message: 'Nimate dostopa do te naloge' } };
  }

  return { task, project };
}

// Pridobi vse komentarje za nalogo
router.get('/task/:taskId', async (req, res) => {
  try {
    const access = await ensureTaskAccess(req.params.taskId, req.user.id);
    if (access.error) {
      return res.status(access.error.status).json({ error: access.error.message });
    }

    const taskComments = await repo.getTaskComments(req.params.taskId);
    res.json(taskComments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Napaka pri pridobivanju komentarjev' });
  }
});

// Ustvari nov komentar
router.post('/', async (req, res) => {
  try {
    const { taskId, content } = req.body;

    if (!taskId || !content) {
      return res.status(400).json({ error: 'ID naloge in vsebina sta obvezna' });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({ error: 'Komentar ne sme biti prazen' });
    }

    const access = await ensureTaskAccess(taskId, req.user.id);
    if (access.error) {
      return res.status(access.error.status).json({ error: access.error.message });
    }

    const newComment = await repo.createComment({
      taskId,
      content: content.trim(),
      authorId: req.user.id,
    });

    res.status(201).json(newComment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Napaka pri ustvarjanju komentarja' });
  }
});

// Posodobi komentar
router.put('/:id', async (req, res) => {
  try {
    const comment = await repo.findCommentById(req.params.id);

    if (!comment) {
      return res.status(404).json({ error: 'Komentar ne obstaja' });
    }

    if (comment.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Samo avtor lahko ureja komentar' });
    }

    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Vsebina komentarja je obvezna' });
    }

    const updated = await repo.updateComment(req.params.id, content.trim());
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Napaka pri posodobitvi komentarja' });
  }
});

// Izbriši komentar
router.delete('/:id', async (req, res) => {
  try {
    const comment = await repo.findCommentById(req.params.id);

    if (!comment) {
      return res.status(404).json({ error: 'Komentar ne obstaja' });
    }

    const access = await ensureTaskAccess(comment.taskId, req.user.id);
    if (access.error) {
      return res.status(access.error.status).json({ error: access.error.message });
    }

    if (comment.authorId !== req.user.id && access.project.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Nimate dovoljenja za brisanje tega komentarja' });
    }

    await repo.deleteComment(req.params.id);
    res.json({ message: 'Komentar uspešno izbrisan' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Napaka pri brisanju komentarja' });
  }
});

module.exports = router;
