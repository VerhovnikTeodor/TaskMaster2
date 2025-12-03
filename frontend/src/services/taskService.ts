import api from './api';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assignedTo: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  project?: {
    id: string;
    name: string;
  };
}

export interface CreateTaskData {
  title: string;
  description?: string;
  projectId: string;
  assignedTo?: string;
  priority?: TaskPriority;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  assignedTo?: string;
  priority?: TaskPriority;
}

export const taskService = {
  async getProjectTasks(projectId: string): Promise<Task[]> {
    const response = await api.get(`/tasks/project/${projectId}`);
    return response.data;
  },

  async getTask(id: string): Promise<Task> {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  async getMyTasks(): Promise<Task[]> {
    const response = await api.get('/tasks/my/tasks');
    return response.data;
  },

  async createTask(data: CreateTaskData): Promise<Task> {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  async updateTask(id: string, data: UpdateTaskData): Promise<Task> {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  async deleteTask(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  }
};
