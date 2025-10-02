import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

const opportunityService = {
  // Get all opportunities with optional filters
  async getOpportunities(filters = {}, page = 1, limit = 10) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });

      // Set skills filter
      if (filters.skills) {
        params.set('skills', filters.skills);
      }

      const response = await api.get(`/opportunities?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const errorData = error.response.data;
        throw {
          success: false,
          error: errorData?.error || `Server error: ${error.response.status}`,
          status: error.response.status
        };
      } else if (error.request) {
        // Request was made but no response received
        throw {
          success: false,
          error: 'Unable to connect to server. Please check your connection.',
          status: 'NETWORK_ERROR'
        };
      } else {
        // Something else happened
        throw {
          success: false,
          error: error.message || 'An unexpected error occurred',
          status: 'UNKNOWN_ERROR'
        };
      }
    }
  },

  // Get single opportunity by ID
  async getOpportunity(id) {
    try {
      const response = await api.get(`/opportunities/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching opportunity:', error);
      
      if (error.response) {
        const errorData = error.response.data;
        throw {
          success: false,
          error: errorData?.error || `Server error: ${error.response.status}`,
          status: error.response.status
        };
      } else if (error.request) {
        throw {
          success: false,
          error: 'Unable to connect to server. Please check your connection.',
          status: 'NETWORK_ERROR'
        };
      } else {
        throw {
          success: false,
          error: error.message || 'An unexpected error occurred',
          status: 'UNKNOWN_ERROR'
        };
      }
    }
  },

  // Create new opportunity (NGO only)
  async createOpportunity(opportunityData) {
    try {
      const response = await api.post('/opportunities', opportunityData);
      return response.data;
    } catch (error) {
      console.error('Error creating opportunity:', error);
      
      if (error.response) {
        const errorData = error.response.data;
        throw {
          success: false,
          error: errorData?.error || `Server error: ${error.response.status}`,
          status: error.response.status
        };
      } else if (error.request) {
        throw {
          success: false,
          error: 'Unable to connect to server. Please check your connection.',
          status: 'NETWORK_ERROR'
        };
      } else {
        throw {
          success: false,
          error: error.message || 'An unexpected error occurred',
          status: 'UNKNOWN_ERROR'
        };
      }
    }
  },

  // Update opportunity (NGO only)
  async updateOpportunity(id, updates) {
    try {
      const response = await api.put(`/opportunities/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating opportunity:', error);
      throw error.response?.data || error;
    }
  },

  // Delete opportunity (NGO only)
  async deleteOpportunity(id) {
    try {
      const response = await api.delete(`/opportunities/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      throw error.response?.data || error;
    }
  },

  // Apply for opportunity (Volunteer only)
  async applyForOpportunity(opportunityId, message = '') {
    try {
      const response = await api.post('/applications', {
        opportunity_id: opportunityId,
        message
      });
      return response.data;
    } catch (error) {
      console.error('Error applying for opportunity:', error);
      throw error.response?.data || error;
    }
  },

  // Get applications for NGO's opportunities
  async getApplications() {
    try {
      const response = await api.get('/applications');
      return response.data;
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw error.response?.data || error;
    }
  },

  // Get applications for current volunteer
  async getMyApplications() {
    try {
      const response = await api.get('/applications/my');
      return response.data;
    } catch (error) {
      console.error('Error fetching my applications:', error);
      throw error.response?.data || error;
    }
  },

  // Update application status (NGO only)
  async updateApplicationStatus(applicationId, status) {
    try {
      const response = await api.put(`/applications/${applicationId}`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating application status:', error);
      throw error.response?.data || error;
    }
  },

  // Withdraw application (Volunteer only)
  async deleteApplication(applicationId) {
    try {
      const response = await api.delete(`/applications/${applicationId}`);
      return response.data;
    } catch (error) {
      console.error('Error withdrawing application:', error);
      throw error.response?.data || error;
    }
  },

  // Get opportunities by NGO
  async getOpportunitiesByNGO(ngoId) {
    try {
      const response = await api.get(`/opportunities?ngo_id=${ngoId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching NGO opportunities:', error);
      throw error.response?.data || error;
    }
  },

  // Get active volunteers count
  async getActiveVolunteersCount() {
    try {
      const response = await api.get('/volunteers/active-count');
      return response.data;
    } catch (error) {
      console.error('Error fetching active volunteers count:', error);
      throw error.response?.data || error;
    }
  }
};

export default opportunityService;
