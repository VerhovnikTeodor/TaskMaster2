import api from './api';

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
}

export interface ProjectStats {
  total: number;
  owned: number;
  member: number;
}

export interface RecentActivity {
  id: string;
  title: string;
  status: string;
  priority: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
  } | null;
  assignee: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface DashboardStats {
  taskStats: TaskStats;
  projectStats: ProjectStats;
  recentActivity: RecentActivity[];
}

export interface ProjectOverview {
  id: string;
  name: string;
  description: string;
  isOwner: boolean;
  memberCount: number;
  taskStats: TaskStats;
  updatedAt: string;
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  async getProjectOverview(): Promise<ProjectOverview[]> {
    const response = await api.get('/dashboard/project-overview');
    return response.data;
  }
};
