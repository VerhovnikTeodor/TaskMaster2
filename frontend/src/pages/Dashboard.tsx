import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardService, DashboardStats, ProjectOverview } from '../services/dashboardService';
import '../styles/Dashboard.css';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projectOverview, setProjectOverview] = useState<ProjectOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsData, overviewData] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getProjectOverview()
        ]);
        setStats(statsData);
        setProjectOverview(overviewData);
      } catch (err: any) {
        setError('Napaka pri nalaganju podatkov');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return '#6c757d';
      case 'IN_PROGRESS': return '#ffc107';
      case 'DONE': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors: any = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#dc3545'
    };
    return colors[priority] || '#6c757d';
  };

  if (loading) {
    return <div className="dashboard-container"><p>Nalaganje...</p></div>;
  }

  if (error) {
    return <div className="dashboard-container"><p className="error">{error}</p></div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>TaskMaster Dashboard</h1>
          <p>Dobrodošli, {user?.firstName} {user?.lastName}!</p>
        </div>
        <div className="header-actions">
          <Link to="/projects" className="btn btn-primary">Moji projekti</Link>
          <Link to="/tasks" className="btn btn-secondary">Moje naloge</Link>
          <button onClick={logout} className="btn btn-logout">Odjava</button>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Projekti</h3>
          <div className="stat-number">{stats?.projectStats.total || 0}</div>
          <div className="stat-details">
            <span>Lastnik: {stats?.projectStats.owned || 0}</span>
            <span>Član: {stats?.projectStats.member || 0}</span>
          </div>
        </div>

        <div className="stat-card">
          <h3>Vse naloge</h3>
          <div className="stat-number">{stats?.taskStats.total || 0}</div>
          <div className="stat-details">
            <span style={{ color: '#6c757d' }}>TODO: {stats?.taskStats.todo || 0}</span>
          </div>
        </div>

        <div className="stat-card">
          <h3>V teku</h3>
          <div className="stat-number" style={{ color: '#ffc107' }}>
            {stats?.taskStats.inProgress || 0}
          </div>
          <div className="stat-details">
            <span>Aktivne naloge</span>
          </div>
        </div>

        <div className="stat-card">
          <h3>Dokončano</h3>
          <div className="stat-number" style={{ color: '#28a745' }}>
            {stats?.taskStats.done || 0}
          </div>
          <div className="stat-details">
            <span>Zaključene naloge</span>
          </div>
        </div>

        <div className="stat-card">
          <h3>💬 Komentarji</h3>
          <div className="stat-number" style={{ color: '#667eea' }}>
            {stats?.commentStats.myComments || 0}
          </div>
          <div className="stat-details">
            <span>Skupaj: {stats?.commentStats.totalComments || 0}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-section">
          <h2>Pregled projektov</h2>
          {projectOverview.length === 0 ? (
            <div className="empty-state">
              <p>Nimate še nobenega projekta</p>
              <Link to="/projects" className="btn btn-primary">Ustvari projekt</Link>
            </div>
          ) : (
            <div className="project-cards">
              {projectOverview.map(project => (
                <div key={project.id} className="project-card">
                  <div className="project-card-header">
                    <h3>{project.name}</h3>
                    {project.isOwner && <span className="owner-badge">Lastnik</span>}
                  </div>
                  <p className="project-description">{project.description}</p>
                  <div className="project-stats">
                    <div className="project-stat">
                      <span className="stat-label">Člani:</span>
                      <span className="stat-value">{project.memberCount}</span>
                    </div>
                    <div className="project-stat">
                      <span className="stat-label">Naloge:</span>
                      <span className="stat-value">{project.taskStats.total}</span>
                    </div>
                  </div>
                  <div className="task-progress">
                    <div className="progress-item">
                      <span style={{ color: '#6c757d' }}>●</span> TODO: {project.taskStats.todo}
                    </div>
                    <div className="progress-item">
                      <span style={{ color: '#ffc107' }}>●</span> V TEKU: {project.taskStats.inProgress}
                    </div>
                    <div className="progress-item">
                      <span style={{ color: '#28a745' }}>●</span> KONČANO: {project.taskStats.done}
                    </div>
                  </div>
                  <Link to={`/projects/${project.id}`} className="btn btn-sm">Odpri projekt</Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <h2>Nedavna aktivnost</h2>
          {stats?.recentActivity.length === 0 ? (
            <p className="empty-state">Ni nedavne aktivnosti</p>
          ) : (
            <div className="activity-list">
              {stats?.recentActivity.map(activity => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-content">
                    <h4>{activity.title}</h4>
                    <p className="activity-project">{activity.project?.name}</p>
                    <div className="activity-meta">
                      <span 
                        className="status-badge" 
                        style={{ backgroundColor: getStatusColor(activity.status) }}
                      >
                        {activity.status}
                      </span>
                      <span 
                        className="priority-badge"
                        style={{ backgroundColor: getPriorityBadge(activity.priority) }}
                      >
                        {activity.priority}
                      </span>
                      {activity.assignee && (
                        <span className="assignee">
                          {activity.assignee.firstName} {activity.assignee.lastName}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="activity-time">
                    {new Date(activity.updatedAt).toLocaleDateString('sl-SI')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
