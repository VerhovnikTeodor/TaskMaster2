
describe('Data Validation Utils', () => {
  test('should validate email format', () => {
    const validEmails = ['test@example.com', 'user@domain.co.uk', 'name+tag@test.com'];
    const invalidEmails = ['invalid', '@example.com', 'test@', 'test @example.com'];
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    validEmails.forEach(email => {
      expect(emailRegex.test(email)).toBe(true);
    });
    
    invalidEmails.forEach(email => {
      expect(emailRegex.test(email)).toBe(false);
    });
  });

  test('should validate password strength', () => {
    const isPasswordValid = (password: string) => password.length >= 6;
    
    expect(isPasswordValid('12345')).toBe(false);
    expect(isPasswordValid('123456')).toBe(true);
    expect(isPasswordValid('strongPassword123')).toBe(true);
  });

  test('should validate required fields', () => {
    const hasRequiredFields = (data: any, fields: string[]) => {
      return fields.every(field => data[field] && data[field].trim() !== '');
    };
    
    const validData = { name: 'Test', email: 'test@test.com' };
    const invalidData = { name: '', email: 'test@test.com' };
    
    expect(hasRequiredFields(validData, ['name', 'email'])).toBe(true);
    expect(hasRequiredFields(invalidData, ['name', 'email'])).toBe(false);
  });
});

describe('Task Status Utils', () => {
  test('should determine next valid status', () => {
    type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
    
    const getNextStatus = (current: TaskStatus): TaskStatus | null => {
      const statusFlow: Record<TaskStatus, TaskStatus | null> = {
        TODO: 'IN_PROGRESS',
        IN_PROGRESS: 'DONE',
        DONE: null
      };
      return statusFlow[current];
    };
    
    expect(getNextStatus('TODO')).toBe('IN_PROGRESS');
    expect(getNextStatus('IN_PROGRESS')).toBe('DONE');
    expect(getNextStatus('DONE')).toBeNull();
  });

  test('should determine previous valid status', () => {
    type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
    
    const getPreviousStatus = (current: TaskStatus): TaskStatus | null => {
      const statusFlow: Record<TaskStatus, TaskStatus | null> = {
        TODO: null,
        IN_PROGRESS: 'TODO',
        DONE: 'IN_PROGRESS'
      };
      return statusFlow[current];
    };
    
    expect(getPreviousStatus('TODO')).toBeNull();
    expect(getPreviousStatus('IN_PROGRESS')).toBe('TODO');
    expect(getPreviousStatus('DONE')).toBe('IN_PROGRESS');
  });

  test('should validate status transitions', () => {
    type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
    
    const isValidTransition = (from: TaskStatus, to: TaskStatus): boolean => {
      const validTransitions: Record<TaskStatus, TaskStatus[]> = {
        TODO: ['IN_PROGRESS'],
        IN_PROGRESS: ['TODO', 'DONE'],
        DONE: ['IN_PROGRESS']
      };
      return validTransitions[from].includes(to);
    };
    
    expect(isValidTransition('TODO', 'IN_PROGRESS')).toBe(true);
    expect(isValidTransition('TODO', 'DONE')).toBe(false);
    expect(isValidTransition('IN_PROGRESS', 'DONE')).toBe(true);
    expect(isValidTransition('DONE', 'TODO')).toBe(false);
  });
});

describe('Date and Time Utils', () => {
  test('should format relative time', () => {
    const getRelativeTime = (dateString: string): string => {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'Pravkar';
      if (diffMins < 60) return `Pred ${diffMins} min`;
      if (diffHours < 24) return `Pred ${diffHours} h`;
      return `Pred ${diffDays} dni`;
    };
    
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const oneDayAgo = new Date(now.getTime() - 86400000);
    
    expect(getRelativeTime(now.toISOString())).toBe('Pravkar');
    expect(getRelativeTime(oneHourAgo.toISOString())).toContain('h');
    expect(getRelativeTime(oneDayAgo.toISOString())).toContain('dni');
  });
});

describe('Priority Utils', () => {
  test('should map priority to color', () => {
    const getPriorityColor = (priority: string): string => {
      const colors: Record<string, string> = {
        low: '#28a745',
        medium: '#ffc107',
        high: '#dc3545'
      };
      return colors[priority] || '#6c757d';
    };
    
    expect(getPriorityColor('low')).toBe('#28a745');
    expect(getPriorityColor('medium')).toBe('#ffc107');
    expect(getPriorityColor('high')).toBe('#dc3545');
    expect(getPriorityColor('unknown')).toBe('#6c757d');
  });

  test('should sort by priority', () => {
    interface Task {
      title: string;
      priority: 'low' | 'medium' | 'high';
    }
    
    const priorityOrder: Record<string, number> = {
      high: 3,
      medium: 2,
      low: 1
    };
    
    const sortByPriority = (tasks: Task[]): Task[] => {
      return [...tasks].sort((a, b) => 
        priorityOrder[b.priority] - priorityOrder[a.priority]
      );
    };
    
    const tasks: Task[] = [
      { title: 'A', priority: 'low' },
      { title: 'B', priority: 'high' },
      { title: 'C', priority: 'medium' }
    ];
    
    const sorted = sortByPriority(tasks);
    expect(sorted[0].priority).toBe('high');
    expect(sorted[1].priority).toBe('medium');
    expect(sorted[2].priority).toBe('low');
  });
});

describe('LocalStorage Utils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('should save and retrieve token', () => {
    const token = 'test-jwt-token';
    localStorage.setItem('token', token);
    
    const retrieved = localStorage.getItem('token');
    expect(retrieved).toBe(token);
  });

  test('should remove token on logout', () => {
    localStorage.setItem('token', 'test-token');
    expect(localStorage.getItem('token')).toBe('test-token');
    
    localStorage.removeItem('token');
    expect(localStorage.getItem('token')).toBeNull();
  });

  test('should check if user is authenticated', () => {
    const isAuthenticated = () => !!localStorage.getItem('token');
    
    expect(isAuthenticated()).toBe(false);
    
    localStorage.setItem('token', 'test-token');
    expect(isAuthenticated()).toBe(true);
  });
});

describe('String Utils', () => {
  test('should capitalize first letter', () => {
    const capitalize = (str: string): string => {
      return str.charAt(0).toUpperCase() + str.slice(1);
    };
    
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('world')).toBe('World');
    expect(capitalize('')).toBe('');
  });

  test('should truncate long text', () => {
    const truncate = (text: string, maxLength: number): string => {
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };
    
    expect(truncate('Short', 10)).toBe('Short');
    expect(truncate('This is a very long text', 10)).toBe('This is a ...');
  });
});
