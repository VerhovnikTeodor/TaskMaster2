import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { taskService, Task } from '../services/taskService';
import { useAuth } from '../context/AuthContext';
import '../styles/Tasks.css';

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'TODO' | 'IN_PROGRESS' | 'DONE'>('all');
  const { logout } = useAuth();

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const fetchMyTasks = async () => {
    try {
      const data = await taskService.getMyTasks();
      setTasks(data);
    } catch (err) {
      console.error('Napaka pri nalaganju nalog');
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(task => task.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return '#6c757d';
      case 'IN_PROGRESS': return '#ffc107';
      case 'DONE': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: any = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#dc3545'
    };
    return colors[priority] || '#6c757d';
  };

  if (loading) {
    return <div className="page-container"><p>Nalaganje...</p></div>;
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Moje naloge</h1>
          <p>Naloge, ki so vam dodeljene</p>
        </div>
        <div className="header-actions">
          <Link to="/dashboard" className="btn btn-secondary">Dashboard</Link>
          <Link to="/projects" className="btn btn-secondary">Projekti</Link>
          <button onClick={logout} className="btn btn-logout">Odjava</button>
        </div>
      </header>

      <div className="filter-bar">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Vse ({tasks.length})
        </button>
        <button 
          className={`filter-btn ${filter === 'TODO' ? 'active' : ''}`}
          onClick={() => setFilter('TODO')}
        >
          TODO ({tasks.filter(t => t.status === 'TODO').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'IN_PROGRESS' ? 'active' : ''}`}
          onClick={() => setFilter('IN_PROGRESS')}
        >
          V TEKU ({tasks.filter(t => t.status === 'IN_PROGRESS').length})
        </button>
        <button 
          className={`filter-btn ${filter === 'DONE' ? 'active' : ''}`}
          onClick={() => setFilter('DONE')}
        >
          KONČANO ({tasks.filter(t => t.status === 'DONE').length})
        </button>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="empty-state">
          <h2>Nimate nalog</h2>
          <p>
            {filter === 'all' 
              ? 'Trenutno vam ni dodeljena nobena naloga' 
              : `Nimate nalog s statusom ${filter}`}
          </p>
        </div>
      ) : (
        <div className="tasks-list">
          {filteredTasks.map(task => (
            <div key={task.id} className="task-item">
              <div className="task-content">
                <div className="task-main">
                  <h3>{task.title}</h3>
                  {task.description && <p>{task.description}</p>}
                </div>
                <div className="task-meta">
                  <span 
                    className="status-badge" 
                    style={{ backgroundColor: getStatusColor(task.status) }}
                  >
                    {task.status}
                  </span>
                  <span 
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(task.priority) }}
                  >
                    {task.priority}
                  </span>
                  {task.project && (
                    <Link 
                      to={`/projects/${task.project.id}`}
                      className="project-link"
                    >
                      📁 {task.project.name}
                    </Link>
                  )}
                </div>
              </div>
              <div className="task-date">
                {new Date(task.updatedAt).toLocaleDateString('sl-SI')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tasks;
