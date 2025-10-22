import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true, // Important: allows cookies to be sent/received
  headers: {
    'Content-Type': 'application/json'
  }
});

// Handle 401 errors (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      // Redirect to login if not already there
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// API service functions
export const authAPI = {
  // Login user
  login: async (username, password) => {
    const response = await api.post('/login', { username, password });
    return response.data;
  },

  // Logout user
  logout: async () => {
    const response = await api.post('/logout');
    return response.data;
  },

  // Get current user info
  getCurrentUser: async () => {
    const response = await api.get('/me');
    return response.data;
  },

  // // Create admin user
  // createAdmin: async (username, email, password) => {
  //   const response = await api.post('/create-admin', { username, email, password });
  //   return response.data;
  // }
};

// User management API
export const userAPI = {
  // Get all users
  getAllUsers: async () => {
    const response = await api.get('/api/users');
    return response.data;
  },

  // Get single user
  getUser: async (username) => {
    const response = await api.get(`/api/users/${username}`);
    return response.data;
  },

  // Create user
  createUser: async (userData) => {
    const response = await api.post('/api/users', userData);
    return response.data;
  },

  // Update user
  updateUser: async (username, userData) => {
    const response = await api.put(`/api/users/${username}`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (username) => {
    const response = await api.delete(`/api/users/${username}`);
    return response.data;
  }
};

// User groups API
export const userGroupAPI = {
  // Get all user groups
  getAllGroups: async () => {
    const response = await api.get('/api/user-groups');
    return response.data;
  },

  // Create user group
  createGroup: async (group_name) => {
    const response = await api.post('/api/user-groups', { group_name });
    return response.data;
  },

  // Delete user group
  deleteGroup: async (group_name) => {
    const response = await api.delete(`/api/user-groups/${group_name}`);
    return response.data;
  }
};

// Application API
export const applicationAPI = {
  // Get all applications
  getAllApplications: async () => {
    const response = await api.get('/api/applications');
    return response.data;
  },

  // Get single application
  getApplication: async (acronym) => {
    const response = await api.get(`/api/applications/${acronym}`);
    return response.data;
  },

  // Create application
  createApplication: async (appData) => {
    const response = await api.post('/api/applications', appData);
    return response.data;
  },

  // Update application
  updateApplication: async (acronym, appData) => {
    const response = await api.put(`/api/applications/${acronym}`, appData);
    return response.data;
  }
};

// Plan API
export const planAPI = {
  // Get all plans for an application
  getAllPlans: async (acronym) => {
    const response = await api.get(`/api/applications/${acronym}/plans`);
    return response.data;
  },

  // Create plan
  createPlan: async (acronym, planData) => {
    const response = await api.post(`/api/applications/${acronym}/plans`, planData);
    return response.data;
  },

  // Update plan
  updatePlan: async (acronym, planName, planData) => {
    const response = await api.put(`/api/applications/${acronym}/plans/${planName}`, planData);
    return response.data;
  }
};

// Task API
export const taskAPI = {
  // Get all tasks for an application
  getAllTasks: async (acronym) => {
    const response = await api.get(`/api/applications/${acronym}/tasks`);
    return response.data;
  },

  // Create task
  createTask: async (acronym, taskData) => {
    const response = await api.post(`/api/applications/${acronym}/tasks`, taskData);
    return response.data;
  },

  // Update task state (state transition)
  updateTaskState: async (acronym, taskId, stateData) => {
    const response = await api.patch(`/api/applications/${acronym}/tasks/${taskId}/state`, stateData);
    return response.data;
  },

  // Update task details
  updateTask: async (acronym, taskId, taskData) => {
    const response = await api.patch(`/api/applications/${acronym}/tasks/${taskId}`, taskData);
    return response.data;
  }
};

export default api;

