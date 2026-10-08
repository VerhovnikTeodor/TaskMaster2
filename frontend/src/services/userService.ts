import api from './api';
import { User } from './authService';

export const userService = {
  async getUsers(): Promise<User[]> {
    const response = await api.get('/auth/users');
    return response.data;
  },
};
