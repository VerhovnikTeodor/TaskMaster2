import api from './api';

export interface Comment {
  id: string;
  taskId: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateCommentData {
  taskId: string;
  content: string;
}

export interface UpdateCommentData {
  content: string;
}

export const commentService = {
  async getTaskComments(taskId: string): Promise<Comment[]> {
    const response = await api.get(`/comments/task/${taskId}`);
    return response.data;
  },

  async createComment(data: CreateCommentData): Promise<Comment> {
    const response = await api.post('/comments', data);
    return response.data;
  },

  async updateComment(id: string, data: UpdateCommentData): Promise<Comment> {
    const response = await api.put(`/comments/${id}`, data);
    return response.data;
  },

  async deleteComment(id: string): Promise<void> {
    await api.delete(`/comments/${id}`);
  }
};
