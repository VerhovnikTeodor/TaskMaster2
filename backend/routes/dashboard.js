const express = require('express');
const { tasks, projects, users } = require('../data/store');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Vsi route-i zahtevajo avtentikacijo
router.use(authenticateToken);

// Pridobi dashboard statistiko
router.get('/stats', (req, res) => {
  const userId = req.user.id;

  // Projekte kjer je uporabnik član
  const userProjects = projects.filter(p => 
    p.ownerId === userId || p.members.includes(userId)
  );

  // Vse naloge v uporabnikovih projektih
  const projectIds = userProjects.map(p => p.id);
  const allProjectTasks = tasks.filter(t => projectIds.includes(t.projectId));

  // Naloge dodeljene uporabniku
  const myTasks = allProjectTasks.filter(t => t.assignedTo === userId);

  // Statistika nalog
  const taskStats = {
    total: myTasks.length,
    todo: myTasks.filter(t => t.status === 'TODO').length,
    inProgress: myTasks.filter(t => t.status === 'IN_PROGRESS').length,
    done: myTasks.filter(t => t.status === 'DONE').length
  };

  // Statistika projektov
  const projectStats = {
    total: userProjects.length,
    owned: userProjects.filter(p => p.ownerId === userId).length,
    member: userProjects.filter(p => p.ownerId !== userId).length
  };

  // Nedavna aktivnost - zadnjih 10 nalog
  const recentTasks = allProjectTasks
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 10)
    .map(task => {
      const project = projects.find(p => p.id === task.projectId);
      const assignee = task.assignedTo ? users.find(u => u.id === task.assignedTo) : null;
      
      return {
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        updatedAt: task.updatedAt,
        project: project ? {
          id: project.id,
          name: project.name
        } : null,
        assignee: assignee ? {
          id: assignee.id,
          firstName: assignee.firstName,
          lastName: assignee.lastName
        } : null
      };
    });

  res.json({
    taskStats,
    projectStats,
    recentActivity: recentTasks
  });
});

// Pridobi pregled aktivnosti po projektih
router.get('/project-overview', (req, res) => {
  const userId = req.user.id;

  const userProjects = projects.filter(p => 
    p.ownerId === userId || p.members.includes(userId)
  );

  const projectOverview = userProjects.map(project => {
    const projectTasks = tasks.filter(t => t.projectId === project.id);
    
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      isOwner: project.ownerId === userId,
      memberCount: project.members.length,
      taskStats: {
        total: projectTasks.length,
        todo: projectTasks.filter(t => t.status === 'TODO').length,
        inProgress: projectTasks.filter(t => t.status === 'IN_PROGRESS').length,
        done: projectTasks.filter(t => t.status === 'DONE').length
      },
      updatedAt: project.updatedAt
    };
  });

  res.json(projectOverview);
});

module.exports = router;
