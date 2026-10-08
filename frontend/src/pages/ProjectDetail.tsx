import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectService, Project, ProjectMember } from '../services/projectService';
import { taskService, Task, TaskStatus } from '../services/taskService';
import { userService } from '../services/userService';
import { User } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import Comments from '../components/Comments';
import '../styles/ProjectDetail.css';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedTaskForComments, setSelectedTaskForComments] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    assignedTo: '',
    dueDate: ''
  });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchProjectData();
    }
  }, [id]);

  const fetchProjectData = async () => {
    try {
      const [projectData, tasksData, usersData] = await Promise.all([
        projectService.getProject(id!),
        taskService.getProjectTasks(id!),
        userService.getUsers()
      ]);
      setProject(projectData);
      setTasks(tasksData);
      setAllUsers(usersData);
    } catch (err) {
      alert('Napaka pri nalaganju projekta');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await taskService.createTask({
        ...newTask,
        projectId: id!,
        assignedTo: newTask.assignedTo || undefined,
        dueDate: newTask.dueDate || undefined
      });
      setShowTaskModal(false);
      setNewTask({ title: '', description: '', priority: 'medium', assignedTo: '', dueDate: '' });
      fetchProjectData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Napaka pri ustvarjanju naloge');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !id) return;

    try {
      const updated = await projectService.addMember(id, selectedMemberId);
      setProject(updated);
      setSelectedMemberId('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Napaka pri dodajanju člana');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!id) return;
    if (!window.confirm('Ali ste prepričani, da želite odstraniti tega člana?')) return;

    try {
      const updated = await projectService.removeMember(id, memberId);
      setProject(updated);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Napaka pri odstranjevanju člana');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await taskService.updateTask(taskId, { status: newStatus });
      fetchProjectData();
    } catch (err) {
      alert('Napaka pri posodobitvi naloge');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Ali ste prepričani, da želite izbrisati to nalogo?')) {
      try {
        await taskService.deleteTask(taskId);
        fetchProjectData();
      } catch (err: any) {
        alert(err.response?.data?.error || 'Napaka pri brisanju naloge');
      }
    }
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  const getStatusLabel = (status: TaskStatus) => {
    const labels = {
      TODO: 'Za narediti',
      IN_PROGRESS: 'V teku',
      DONE: 'Končano'
    };
    return labels[status];
  };

  const getPriorityColor = (priority: string) => {
    const colors: any = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#dc3545'
    };
    return colors[priority] || '#6c757d';
  };

  const isOverdue = (dueDate?: string | null) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dueDate) < today;
  };

  const formatDueDate = (dueDate?: string | null) => {
    if (!dueDate) return null;
    return new Date(dueDate).toLocaleDateString('sl-SI');
  };

  if (loading) {
    return <div className="page-container"><p>Nalaganje...</p></div>;
  }

  if (!project) {
    return <div className="page-container"><p>Projekt ne obstaja</p></div>;
  }

  const isOwner = project.ownerId === user?.id;
  const members: ProjectMember[] = project.memberDetails || [];
  const availableUsers = allUsers.filter(
    (u) => !project.members.includes(u.id)
  );

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <Link to="/projects" className="back-link">← Nazaj na projekte</Link>
          <h1>{project.name}</h1>
          <p>{project.description}</p>
        </div>
        <div className="header-actions">
          <Link to="/dashboard" className="btn btn-secondary">Dashboard</Link>
          <button onClick={() => setShowTaskModal(true)} className="btn btn-primary">
            + Nova naloga
          </button>
          <button onClick={logout} className="btn btn-logout">Odjava</button>
        </div>
      </header>

      <div className="project-info">
        <div className="info-item">
          <strong>Članov:</strong> {project.members.length}
        </div>
        <div className="info-item">
          <strong>Nalog:</strong> {tasks.length}
        </div>
        <div className="info-item">
          <strong>Status:</strong> {isOwner ? 'Lastnik' : 'Član'}
        </div>
      </div>

      <section className="members-section">
        <h2>Člani projekta</h2>
        <ul className="members-list">
          {members.map((member) => (
            <li key={member.id} className="member-item">
              <div>
                <strong>{member.firstName} {member.lastName}</strong>
                <span className="member-email">{member.email}</span>
                {member.id === project.ownerId && (
                  <span className="owner-chip">Lastnik</span>
                )}
              </div>
              {isOwner && member.id !== project.ownerId && (
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="btn btn-xs btn-danger"
                >
                  Odstrani
                </button>
              )}
            </li>
          ))}
        </ul>

        {isOwner && (
          <form onSubmit={handleAddMember} className="add-member-form">
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              required
            >
              <option value="">Izberi uporabnika...</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.email})
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!selectedMemberId || availableUsers.length === 0}
            >
              Dodaj člana
            </button>
          </form>
        )}
        {isOwner && availableUsers.length === 0 && (
          <p className="hint-text">Vsi registrirani uporabniki so že člani tega projekta.</p>
        )}
      </section>

      <div className="kanban-board">
        {(['TODO', 'IN_PROGRESS', 'DONE'] as TaskStatus[]).map(status => (
          <div key={status} className="kanban-column">
            <div className="kanban-header">
              <h3>{getStatusLabel(status)}</h3>
              <span className="task-count">{getTasksByStatus(status).length}</span>
            </div>
            <div className="kanban-tasks">
              {getTasksByStatus(status).map(task => (
                <div key={task.id} className="task-card">
                  <div className="task-header">
                    <h4>{task.title}</h4>
                    <span
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(task.priority) }}
                    >
                      {task.priority}
                    </span>
                  </div>
                  {task.description && (
                    <p className="task-description">{task.description}</p>
                  )}
                  {task.assignee && (
                    <div className="task-assignee">
                      👤 {task.assignee.firstName} {task.assignee.lastName}
                    </div>
                  )}
                  {task.dueDate && (
                    <div className={`task-due ${isOverdue(task.dueDate) && status !== 'DONE' ? 'overdue' : ''}`}>
                      📅 Rok: {formatDueDate(task.dueDate)}
                      {isOverdue(task.dueDate) && status !== 'DONE' ? ' (zapadel)' : ''}
                    </div>
                  )}
                  <div className="task-actions">
                    <button
                      onClick={() => setSelectedTaskForComments(
                        selectedTaskForComments === task.id ? null : task.id
                      )}
                      className="btn btn-xs btn-comment"
                      title="Komentarji"
                    >
                      💬
                    </button>
                    {status !== 'TODO' && (
                      <button
                        onClick={() => handleStatusChange(task.id, status === 'IN_PROGRESS' ? 'TODO' : 'IN_PROGRESS')}
                        className="btn btn-xs"
                      >
                        ← {status === 'IN_PROGRESS' ? 'TODO' : 'V teku'}
                      </button>
                    )}
                    {status !== 'DONE' && (
                      <button
                        onClick={() => handleStatusChange(task.id, status === 'TODO' ? 'IN_PROGRESS' : 'DONE')}
                        className="btn btn-xs"
                      >
                        {status === 'TODO' ? 'V teku' : 'Končano'} →
                      </button>
                    )}
                    {(isOwner || task.createdBy === user?.id) && (
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="btn btn-xs btn-danger"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                  {selectedTaskForComments === task.id && (
                    <Comments taskId={task.id} projectOwnerId={project.ownerId} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nova naloga</h2>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label htmlFor="title">Naslov *</label>
                <input
                  type="text"
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  required
                  placeholder="Vnesite naslov naloge"
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Opis</label>
                <textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Vnesite opis naloge"
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label htmlFor="priority">Prioriteta</label>
                <select
                  id="priority"
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                >
                  <option value="low">Nizka</option>
                  <option value="medium">Srednja</option>
                  <option value="high">Visoka</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="dueDate">Rok</label>
                <input
                  type="date"
                  id="dueDate"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="assignedTo">Dodeli članu</label>
                <select
                  id="assignedTo"
                  value={newTask.assignedTo}
                  onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                >
                  <option value="">Brez dodelitve</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.firstName} {member.lastName} ({member.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowTaskModal(false)} className="btn btn-secondary">
                  Prekliči
                </button>
                <button type="submit" className="btn btn-primary">
                  Ustvari
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
