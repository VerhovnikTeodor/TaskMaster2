const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { comments, tasks, projects, users } = require('../data/store');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Vsi route-i zahtevajo avtentikacijo
router.use(authenticateToken);

// Pridobi vse komentarje za nalogo
router.get('/task/:taskId', (req, res) => {
  const { taskId } = req.params;

  // Preveri če naloga obstaja
  const task = tasks.find(t => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: 'Naloga ne obstaja' });
  }

  // Preveri dostop do projekta
  const project = projects.find(p => p.id === task.projectId);
  if (project.ownerId !== req.user.id && !project.members.includes(req.user.id)) {
    return res.status(403).json({ error: 'Nimate dostopa do te naloge' });
  }

  // Pridobi komentarje za nalogo
  const taskComments = comments
    .filter(c => c.taskId === taskId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(comment => {
      const author = users.find(u => u.id === comment.authorId);
      return {
        ...comment,
        author: author ? {
          id: author.id,
          firstName: author.firstName,
          lastName: author.lastName,
          email: author.email
        } : null
      };
    });

  res.json(taskComments);
});

// Ustvari nov komentar
router.post('/', (req, res) => {
  const { taskId, content } = req.body;

  if (!taskId || !content) {
    return res.status(400).json({ error: 'ID naloge in vsebina sta obvezna' });
  }

  if (content.trim().length === 0) {
    return res.status(400).json({ error: 'Komentar ne sme biti prazen' });
  }

  // Preveri če naloga obstaja
  const task = tasks.find(t => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: 'Naloga ne obstaja' });
  }

  // Preveri dostop do projekta
  const project = projects.find(p => p.id === task.projectId);
  if (project.ownerId !== req.user.id && !project.members.includes(req.user.id)) {
    return res.status(403).json({ error: 'Nimate dostopa do te naloge' });
  }

  const newComment = {
    id: uuidv4(),
    taskId,
    content: content.trim(),
    authorId: req.user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  comments.push(newComment);

  // Dodaj informacije o avtorju
  const author = users.find(u => u.id === req.user.id);
  const commentWithAuthor = {
    ...newComment,
    author: author ? {
      id: author.id,
      firstName: author.firstName,
      lastName: author.lastName,
      email: author.email
    } : null
  };

  res.status(201).json(commentWithAuthor);
});

// Posodobi komentar
router.put('/:id', (req, res) => {
  const comment = comments.find(c => c.id === req.params.id);

  if (!comment) {
    return res.status(404).json({ error: 'Komentar ne obstaja' });
  }

  // Samo avtor lahko ureja komentar
  if (comment.authorId !== req.user.id) {
    return res.status(403).json({ error: 'Samo avtor lahko ureja komentar' });
  }

  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Vsebina komentarja je obvezna' });
  }

  comment.content = content.trim();
  comment.updatedAt = new Date().toISOString();

  // Dodaj informacije o avtorju
  const author = users.find(u => u.id === comment.authorId);
  const commentWithAuthor = {
    ...comment,
    author: author ? {
      id: author.id,
      firstName: author.firstName,
      lastName: author.lastName,
      email: author.email
    } : null
  };

  res.json(commentWithAuthor);
});

// Izbriši komentar
router.delete('/:id', (req, res) => {
  const commentIndex = comments.findIndex(c => c.id === req.params.id);

  if (commentIndex === -1) {
    return res.status(404).json({ error: 'Komentar ne obstaja' });
  }

  const comment = comments[commentIndex];

  // Preveri če je uporabnik avtor komentarja ali lastnik projekta
  const task = tasks.find(t => t.id === comment.taskId);
  const project = projects.find(p => p.id === task.projectId);

  if (comment.authorId !== req.user.id && project.ownerId !== req.user.id) {
    return res.status(403).json({ error: 'Nimate dovoljenja za brisanje tega komentarja' });
  }

  comments.splice(commentIndex, 1);

  res.json({ message: 'Komentar uspešno izbrisan' });
});

module.exports = router;
