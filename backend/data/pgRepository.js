const { v4: uuidv4 } = require('uuid');
const { query } = require('./db');

function mapUserRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    firstName: row.first_name,
    lastName: row.last_name,
    createdAt: row.created_at,
  };
}

function publicUserFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
  };
}

async function getMemberIds(projectId) {
  const result = await query(
    'SELECT user_id FROM project_members WHERE project_id = $1',
    [projectId]
  );
  return result.rows.map((r) => r.user_id);
}

async function mapProject(row) {
  if (!row) return null;
  const members = await getMemberIds(row.id);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    ownerId: row.owner_id,
    members,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTask(row, assignee = null) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    projectId: row.project_id,
    assignedTo: row.assigned_to,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date || null,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    assignee: assignee || null,
  };
}

async function createUser({ email, password, firstName, lastName }) {
  const id = uuidv4();
  const result = await query(
    `INSERT INTO users (id, email, password, first_name, last_name)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [id, email, password, firstName, lastName]
  );
  return mapUserRow(result.rows[0]);
}

async function findUserByEmail(email) {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return mapUserRow(result.rows[0]);
}

async function findUserById(id) {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return mapUserRow(result.rows[0]);
}

async function listUsers() {
  const result = await query(
    'SELECT id, email, first_name, last_name FROM users ORDER BY first_name, last_name'
  );
  return result.rows.map(publicUserFromRow);
}

async function getProjectMembers(projectId) {
  const result = await query(
    `SELECT u.id, u.email, u.first_name, u.last_name
     FROM project_members pm
     JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = $1
     ORDER BY u.first_name, u.last_name`,
    [projectId]
  );
  return result.rows.map(publicUserFromRow);
}

async function getUserProjects(userId) {
  const result = await query(
    `SELECT DISTINCT p.*
     FROM projects p
     LEFT JOIN project_members pm ON pm.project_id = p.id
     WHERE p.owner_id = $1 OR pm.user_id = $1
     ORDER BY p.updated_at DESC`,
    [userId]
  );
  return Promise.all(result.rows.map(mapProject));
}

async function findProjectById(id) {
  const result = await query('SELECT * FROM projects WHERE id = $1', [id]);
  return mapProject(result.rows[0]);
}

async function createProject({ name, description, ownerId }) {
  const id = uuidv4();
  const result = await query(
    `INSERT INTO projects (id, name, description, owner_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [id, name, description || '', ownerId]
  );
  await query(
    'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2)',
    [id, ownerId]
  );
  return mapProject(result.rows[0]);
}

async function updateProject(id, { name, description }) {
  const existing = await query('SELECT * FROM projects WHERE id = $1', [id]);
  if (!existing.rows[0]) return null;

  const result = await query(
    `UPDATE projects
     SET name = COALESCE($2, name),
         description = COALESCE($3, description),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      name || null,
      description !== undefined ? description : null,
    ]
  );
  return mapProject(result.rows[0]);
}

async function deleteProject(id) {
  const result = await query('DELETE FROM projects WHERE id = $1', [id]);
  return result.rowCount > 0;
}

async function addProjectMember(projectId, userId) {
  await query(
    `INSERT INTO project_members (project_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [projectId, userId]
  );
  await query('UPDATE projects SET updated_at = NOW() WHERE id = $1', [projectId]);
  return findProjectById(projectId);
}

async function removeProjectMember(projectId, userId) {
  const result = await query(
    'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, userId]
  );
  if (result.rowCount === 0) return null;
  await query('UPDATE projects SET updated_at = NOW() WHERE id = $1', [projectId]);
  return findProjectById(projectId);
}

async function getProjectTasks(projectId) {
  const result = await query(
    `SELECT t.*,
            u.id AS assignee_id,
            u.email AS assignee_email,
            u.first_name AS assignee_first_name,
            u.last_name AS assignee_last_name
     FROM tasks t
     LEFT JOIN users u ON u.id = t.assigned_to
     WHERE t.project_id = $1
     ORDER BY t.created_at DESC`,
    [projectId]
  );

  return result.rows.map((row) =>
    mapTask(
      row,
      row.assignee_id
        ? {
            id: row.assignee_id,
            email: row.assignee_email,
            firstName: row.assignee_first_name,
            lastName: row.assignee_last_name,
          }
        : null
    )
  );
}

async function findTaskById(id) {
  const result = await query(
    `SELECT t.*,
            u.id AS assignee_id,
            u.email AS assignee_email,
            u.first_name AS assignee_first_name,
            u.last_name AS assignee_last_name
     FROM tasks t
     LEFT JOIN users u ON u.id = t.assigned_to
     WHERE t.id = $1`,
    [id]
  );
  const row = result.rows[0];
  if (!row) return null;
  return mapTask(
    row,
    row.assignee_id
      ? {
          id: row.assignee_id,
          email: row.assignee_email,
          firstName: row.assignee_first_name,
          lastName: row.assignee_last_name,
        }
      : null
  );
}

async function getMyTasks(userId) {
  const result = await query(
    `SELECT t.*,
            p.id AS project_ref_id,
            p.name AS project_name,
            u.id AS assignee_id,
            u.email AS assignee_email,
            u.first_name AS assignee_first_name,
            u.last_name AS assignee_last_name
     FROM tasks t
     LEFT JOIN projects p ON p.id = t.project_id
     LEFT JOIN users u ON u.id = t.assigned_to
     WHERE t.assigned_to = $1
     ORDER BY t.due_date NULLS LAST, t.updated_at DESC`,
    [userId]
  );

  return result.rows.map((row) => ({
    ...mapTask(
      row,
      row.assignee_id
        ? {
            id: row.assignee_id,
            email: row.assignee_email,
            firstName: row.assignee_first_name,
            lastName: row.assignee_last_name,
          }
        : null
    ),
    project: row.project_ref_id
      ? { id: row.project_ref_id, name: row.project_name }
      : null,
  }));
}

async function createTask(data) {
  const id = uuidv4();
  const result = await query(
    `INSERT INTO tasks
      (id, title, description, project_id, assigned_to, status, priority, due_date, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      id,
      data.title,
      data.description || '',
      data.projectId,
      data.assignedTo || null,
      data.status || 'TODO',
      data.priority || 'medium',
      data.dueDate || null,
      data.createdBy,
    ]
  );
  return findTaskById(result.rows[0].id);
}

async function updateTask(id, updates) {
  const existing = await findTaskById(id);
  if (!existing) return null;

  const result = await query(
    `UPDATE tasks
     SET title = COALESCE($2, title),
         description = COALESCE($3, description),
         status = COALESCE($4, status),
         assigned_to = CASE WHEN $5::boolean THEN $6 ELSE assigned_to END,
         priority = COALESCE($7, priority),
         due_date = CASE WHEN $8::boolean THEN $9 ELSE due_date END,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [
      id,
      updates.title || null,
      updates.description !== undefined ? updates.description : null,
      updates.status || null,
      updates.assignedTo !== undefined,
      updates.assignedTo !== undefined ? updates.assignedTo : null,
      updates.priority || null,
      updates.dueDate !== undefined,
      updates.dueDate !== undefined ? updates.dueDate : null,
    ]
  );

  if (!result.rows[0]) return null;
  return findTaskById(id);
}

async function deleteTask(id) {
  const result = await query('DELETE FROM tasks WHERE id = $1', [id]);
  return result.rowCount > 0;
}

async function getTaskComments(taskId) {
  const result = await query(
    `SELECT c.*, u.id AS user_id, u.email, u.first_name, u.last_name
     FROM comments c
     LEFT JOIN users u ON u.id = c.author_id
     WHERE c.task_id = $1
     ORDER BY c.created_at DESC`,
    [taskId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    taskId: row.task_id,
    content: row.content,
    authorId: row.author_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: row.user_id
      ? {
          id: row.user_id,
          email: row.email,
          firstName: row.first_name,
          lastName: row.last_name,
        }
      : null,
  }));
}

async function findCommentById(id) {
  const result = await query(
    `SELECT c.*, u.id AS user_id, u.email, u.first_name, u.last_name
     FROM comments c
     LEFT JOIN users u ON u.id = c.author_id
     WHERE c.id = $1`,
    [id]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    taskId: row.task_id,
    content: row.content,
    authorId: row.author_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: row.user_id
      ? {
          id: row.user_id,
          email: row.email,
          firstName: row.first_name,
          lastName: row.last_name,
        }
      : null,
  };
}

async function createComment({ taskId, content, authorId }) {
  const id = uuidv4();
  await query(
    `INSERT INTO comments (id, task_id, content, author_id)
     VALUES ($1, $2, $3, $4)`,
    [id, taskId, content, authorId]
  );
  return findCommentById(id);
}

async function updateComment(id, content) {
  const result = await query(
    `UPDATE comments
     SET content = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [id, content]
  );
  if (!result.rows[0]) return null;
  return findCommentById(id);
}

async function deleteComment(id) {
  const result = await query('DELETE FROM comments WHERE id = $1', [id]);
  return result.rowCount > 0;
}

async function getDashboardStats(userId) {
  const userProjects = await getUserProjects(userId);
  const projectIds = userProjects.map((p) => p.id);

  if (projectIds.length === 0) {
    return {
      taskStats: { total: 0, todo: 0, inProgress: 0, done: 0 },
      projectStats: { total: 0, owned: 0, member: 0 },
      commentStats: { myComments: 0, totalComments: 0 },
      recentActivity: [],
    };
  }

  const myTasksResult = await query(
    `SELECT status FROM tasks
     WHERE assigned_to = $1 AND project_id = ANY($2::uuid[])`,
    [userId, projectIds]
  );

  const myCommentsResult = await query(
    'SELECT COUNT(*)::int AS count FROM comments WHERE author_id = $1',
    [userId]
  );

  const totalCommentsResult = await query(
    `SELECT COUNT(*)::int AS count
     FROM comments c
     JOIN tasks t ON t.id = c.task_id
     WHERE t.project_id = ANY($1::uuid[])`,
    [projectIds]
  );

  const recentResult = await query(
    `SELECT t.id, t.title, t.status, t.priority, t.due_date, t.updated_at,
            p.id AS project_id, p.name AS project_name,
            u.id AS assignee_id, u.first_name, u.last_name
     FROM tasks t
     LEFT JOIN projects p ON p.id = t.project_id
     LEFT JOIN users u ON u.id = t.assigned_to
     WHERE t.project_id = ANY($1::uuid[])
     ORDER BY t.updated_at DESC
     LIMIT 10`,
    [projectIds]
  );

  const myTasks = myTasksResult.rows;

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
      myComments: myCommentsResult.rows[0].count,
      totalComments: totalCommentsResult.rows[0].count,
    },
    recentActivity: recentResult.rows.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      priority: row.priority,
      dueDate: row.due_date || null,
      updatedAt: row.updated_at,
      project: row.project_id
        ? { id: row.project_id, name: row.project_name }
        : null,
      assignee: row.assignee_id
        ? {
            id: row.assignee_id,
            firstName: row.first_name,
            lastName: row.last_name,
          }
        : null,
    })),
  };
}

async function getProjectOverview(userId) {
  const userProjects = await getUserProjects(userId);

  return Promise.all(
    userProjects.map(async (project) => {
      const stats = await query(
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE status = 'TODO')::int AS todo,
           COUNT(*) FILTER (WHERE status = 'IN_PROGRESS')::int AS in_progress,
           COUNT(*) FILTER (WHERE status = 'DONE')::int AS done
         FROM tasks
         WHERE project_id = $1`,
        [project.id]
      );
      const row = stats.rows[0];
      return {
        id: project.id,
        name: project.name,
        description: project.description,
        isOwner: project.ownerId === userId,
        memberCount: project.members.length,
        taskStats: {
          total: row.total,
          todo: row.todo,
          inProgress: row.in_progress,
          done: row.done,
        },
        updatedAt: project.updatedAt,
      };
    })
  );
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
