import api from './api';
import { User } from './authService';

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
}

export const projectService = {
  async getProjects(): Promise<Project[]> {
    const response = await api.get('/projects');
    return response.data;
  },

  async getProject(id: string): Promise<Project> {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  async createProject(data: CreateProjectData): Promise<Project> {
    const response = await api.post('/projects', data);
    return response.data;
  },

  async updateProject(id: string, data: Partial<CreateProjectData>): Promise<Project> {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  },

  async deleteProject(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  },

  async addMember(projectId: string, userId: string): Promise<Project> {
    const response = await api.post(`/projects/${projectId}/members`, { userId });
    return response.data;
  },

  async removeMember(projectId: string, userId: string): Promise<Project> {
    const response = await api.delete(`/projects/${projectId}/members/${userId}`);
    return response.data;
  }
};
