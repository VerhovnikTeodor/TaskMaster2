import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { projectService, Project } from '../services/projectService';
import { useAuth } from '../context/AuthContext';
import '../styles/Projects.css';

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (err) {
      setError('Napaka pri nalaganju projektov');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await projectService.createProject(newProject);
      setShowModal(false);
      setNewProject({ name: '', description: '' });
      fetchProjects();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Napaka pri ustvarjanju projekta');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (window.confirm('Ali ste prepričani, da želite izbrisati ta projekt?')) {
      try {
        await projectService.deleteProject(id);
        fetchProjects();
      } catch (err: any) {
        alert(err.response?.data?.error || 'Napaka pri brisanju projekta');
      }
    }
  };

  if (loading) {
    return <div className="page-container"><p>Nalaganje...</p></div>;
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>Moji projekti</h1>
          <p>Upravljaj svoje projekte in ekipe</p>
        </div>
        <div className="header-actions">
          <Link to="/dashboard" className="btn btn-secondary">Dashboard</Link>
          <Link to="/tasks" className="btn btn-secondary">Moje naloge</Link>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            + Nov projekt
          </button>
          <button onClick={logout} className="btn btn-logout">Odjava</button>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      {projects.length === 0 ? (
        <div className="empty-state">
          <h2>Še nimate projektov</h2>
          <p>Ustvarite svoj prvi projekt in začnite organizirati naloge</p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            Ustvari projekt
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <div key={project.id} className="project-card">
              <div className="project-card-header">
                <h3>{project.name}</h3>
                {project.ownerId === user?.id && (
                  <span className="owner-badge">Lastnik</span>
                )}
              </div>
              <p className="project-description">
                {project.description || 'Brez opisa'}
              </p>
              <div className="project-meta">
                <span>Članov: {project.members.length}</span>
                <span>
                  Ustvarjeno: {new Date(project.createdAt).toLocaleDateString('sl-SI')}
                </span>
              </div>
              <div className="project-actions">
                <Link to={`/projects/${project.id}`} className="btn btn-sm btn-primary">
                  Odpri
                </Link>
                {project.ownerId === user?.id && (
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="btn btn-sm btn-danger"
                  >
                    Izbriši
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nov projekt</h2>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label htmlFor="name">Ime projekta *</label>
                <input
                  type="text"
                  id="name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  required
                  placeholder="Vnesite ime projekta"
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Opis</label>
                <textarea
                  id="description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Vnesite opis projekta"
                  rows={4}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
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

export default Projects;
