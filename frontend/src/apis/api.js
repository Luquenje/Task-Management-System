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

export default api;

