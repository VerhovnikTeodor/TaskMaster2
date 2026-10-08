const { v4: uuidv4 } = require('uuid');
const { users, projects, tasks, comments } = require('./store');

function mapUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    password: user.password,
    firstName: user.firstName,
    lastName: user.lastName,
    createdAt: user.createdAt,
  };
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

async function createUser({ email, password, firstName, lastName }) {
  const newUser = {
    id: uuidv4(),
    email,
    password,
    firstName,
    lastName,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  return mapUser(newUser);
}

async function findUserByEmail(email) {
  return mapUser(users.find((u) => u.email === email));
}

async function findUserById(id) {
  return mapUser(users.find((u) => u.id === id));
}

async function listUsers() {
  return users.map(publicUser);
}

async function getProjectMembers(projectId) {
  const project = projects.find((p) => p.id === projectId);
  if (!project) return [];
  return project.members
    .map((memberId) => publicUser(users.find((u) => u.id === memberId)))
    .filter(Boolean);
}

async function getUserProjects(userId) {
  return projects
    .filter((p) => p.ownerId === userId || p.members.includes(userId))
    .map((p) => ({ ...p }));
}

async function findProjectById(id) {
  const project = projects.find((p) => p.id === id);
  return project ? { ...project, members: [...project.members] } : null;
}

async function createProject({ name, description, ownerId }) {
  const newProject = {
    id: uuidv4(),
    name,
    description: description || '',
    ownerId,
    members: [ownerId],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  projects.push(newProject);
  return { ...newProject, members: [...newProject.members] };
}

async function updateProject(id, { name, description }) {
  const project = projects.find((p) => p.id === id);
  if (!project) return null;
  if (name) project.name = name;
  if (description !== undefined) project.description = description;
  project.updatedAt = new Date().toISOString();
  return { ...project, members: [...project.members] };
}

async function deleteProject(id) {
  const index = projects.findIndex((p) => p.id === id);
  if (index === -1) return false;
  const projectId = projects[index].id;
  projects.splice(index, 1);
  for (let i = tasks.length - 1; i >= 0; i--) {
    if (tasks[i].projectId === projectId) {
      const taskId = tasks[i].id;
      tasks.splice(i, 1);
      for (let j = comments.length - 1; j >= 0; j--) {
        if (comments[j].taskId === taskId) comments.splice(j, 1);
      }
    }
  }
  return true;
}

async function addProjectMember(projectId, userId) {
  const project = projects.find((p) => p.id === projectId);
  if (!project) return null;
  if (!project.members.includes(userId)) {
    project.members.push(userId);
    project.updatedAt = new Date().toISOString();
  }
  return { ...project, members: [...project.members] };
}

async function removeProjectMember(projectId, userId) {
  const project = projects.find((p) => p.id === projectId);
  if (!project) return null;
  const memberIndex = project.members.indexOf(userId);
  if (memberIndex === -1) return null;
  project.members.splice(memberIndex, 1);
  project.updatedAt = new Date().toISOString();
  return { ...project, members: [...project.members] };
}

async function getProjectTasks(projectId) {
  return tasks
    .filter((t) => t.projectId === projectId)
    .map((task) => enrichTask(task));
}

async function findTaskById(id) {
  const task = tasks.find((t) => t.id === id);
  return task ? enrichTask(task) : null;
}

async function getMyTasks(userId) {
  return tasks
    .filter((t) => t.assignedTo === userId)
    .map((task) => {
      const enriched = enrichTask(task);
      const project = projects.find((p) => p.id === task.projectId);
      return {
        ...enriched,
        project: project ? { id: project.id, name: project.name } : null,
      };
    });
}

async function createTask(data) {
  const newTask = {
    id: uuidv4(),
    title: data.title,
    description: data.description || '',
    projectId: data.projectId,
    assignedTo: data.assignedTo || null,
    status: data.status || 'TODO',
    priority: data.priority || 'medium',
    dueDate: data.dueDate || null,
    createdBy: data.createdBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  tasks.push(newTask);
  return enrichTask(newTask);
}

async function updateTask(id, updates) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return null;
  if (updates.title) task.title = updates.title;
  if (updates.description !== undefined) task.description = updates.description;
  if (updates.status) task.status = updates.status;
  if (updates.assignedTo !== undefined) task.assignedTo = updates.assignedTo;
  if (updates.priority) task.priority = updates.priority;
  if (updates.dueDate !== undefined) task.dueDate = updates.dueDate;
  task.updatedAt = new Date().toISOString();
  return enrichTask(task);
}

async function deleteTask(id) {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return false;
  tasks.splice(index, 1);
  for (let i = comments.length - 1; i >= 0; i--) {
    if (comments[i].taskId === id) comments.splice(i, 1);
  }
  return true;
}

async function getTaskComments(taskId) {
  return comments
    .filter((c) => c.taskId === taskId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((comment) => ({
      ...comment,
      author: publicUser(users.find((u) => u.id === comment.authorId)),
    }));
}

async function findCommentById(id) {
  const comment = comments.find((c) => c.id === id);
  if (!comment) return null;
  return {
    ...comment,
    author: publicUser(users.find((u) => u.id === comment.authorId)),
  };
}

async function createComment({ taskId, content, authorId }) {
  const newComment = {
    id: uuidv4(),
    taskId,
    content,
    authorId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  comments.push(newComment);
  return {
    ...newComment,
    author: publicUser(users.find((u) => u.id === authorId)),
  };
}

async function updateComment(id, content) {
  const comment = comments.find((c) => c.id === id);
  if (!comment) return null;
  comment.content = content;
  comment.updatedAt = new Date().toISOString();
  return {
    ...comment,
    author: publicUser(users.find((u) => u.id === comment.authorId)),
  };
}

async function deleteComment(id) {
  const index = comments.findIndex((c) => c.id === id);
  if (index === -1) return false;
  comments.splice(index, 1);
  return true;
}

async function getDashboardStats(userId) {
  const userProjects = projects.filter(
    (p) => p.ownerId === userId || p.members.includes(userId)
  );
  const projectIds = userProjects.map((p) => p.id);
  const allProjectTasks = tasks.filter((t) => projectIds.includes(t.projectId));
  const myTasks = allProjectTasks.filter((t) => t.assignedTo === userId);
  const myComments = comments.filter((c) => c.authorId === userId);
  const totalComments = comments.filter((c) => {
    const task = tasks.find((t) => t.id === c.taskId);
    return task && projectIds.includes(task.projectId);
  });

  const recentTasks = allProjectTasks
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 10)
    .map((task) => {
      const project = projects.find((p) => p.id === task.projectId);
      const assignee = task.assignedTo
        ? users.find((u) => u.id === task.assignedTo)
        : null;
      return {
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate || null,
        updatedAt: task.updatedAt,
        project: project ? { id: project.id, name: project.name } : null,
        assignee: publicUser(assignee),
      };
    });

  return {
    taskStats: {
      total: myTasks.length,
      todo: myTasks.filter((t) => t.status === 'TODO').length,
      inProgress: myTasks.filter((t) => t.status === 'IN_PROGRESS').length,
      done: myTasks.filter((t) => t.status === 'DONE').length,
    },
    projectStats: {
      total: userProjects.length,
      owned: userProjects.filter((p) => p.ownerId === userId).length,
      member: userProjects.filter((p) => p.ownerId !== userId).length,
    },
    commentStats: {
      myComments: myComments.length,
      totalComments: totalComments.length,
    },
    recentActivity: recentTasks,
  };
}

async function getProjectOverview(userId) {
  const userProjects = projects.filter(
    (p) => p.ownerId === userId || p.members.includes(userId)
  );

  return userProjects.map((project) => {
    const projectTasks = tasks.filter((t) => t.projectId === project.id);
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      isOwner: project.ownerId === userId,
      memberCount: project.members.length,
      taskStats: {
        total: projectTasks.length,
        todo: projectTasks.filter((t) => t.status === 'TODO').length,
        inProgress: projectTasks.filter((t) => t.status === 'IN_PROGRESS').length,
        done: projectTasks.filter((t) => t.status === 'DONE').length,
      },
      updatedAt: project.updatedAt,
    };
  });
}

function enrichTask(task) {
  const result = {
    id: task.id,
    title: task.title,
    description: task.description,
    projectId: task.projectId,
    assignedTo: task.assignedTo || null,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate || null,
    createdBy: task.createdBy,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };

  if (task.assignedTo) {
    result.assignee = publicUser(users.find((u) => u.id === task.assignedTo));
  }

  return result;
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  listUsers,
  getProjectMembers,
  getUserProjects,
  findProjectById,
  createProject,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  getProjectTasks,
  findTaskById,
  getMyTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskComments,
  findCommentById,
  createComment,
  updateComment,
  deleteComment,
  getDashboardStats,
  getProjectOverview,
};
