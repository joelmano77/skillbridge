const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class AuthService {
  constructor() {
    this.token = localStorage.getItem('token');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

  // Make authenticated API calls
  async makeRequest(url, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Login user
  async login(email, password) {
    try {
      const response = await this.makeRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.success) {
        this.token = response.token;
        this.user = response.user;
        
        localStorage.setItem('token', this.token);
        localStorage.setItem('user', JSON.stringify(this.user));
        
        return { success: true, user: this.user };
      }

      throw new Error(response.error || 'Login failed');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Register user
  async register(userData) {
    try {
      const response = await this.makeRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      if (response.success) {
        this.token = response.token;
        this.user = response.user;
        
        localStorage.setItem('token', this.token);
        localStorage.setItem('user', JSON.stringify(this.user));
        
        return { success: true, user: this.user };
      }

      throw new Error(response.error || 'Registration failed');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Get current user
  async getCurrentUser() {
    if (!this.token) {
      return null;
    }

    try {
      const response = await this.makeRequest('/api/auth/me');
      
      if (response.success) {
        this.user = response.user;
        localStorage.setItem('user', JSON.stringify(this.user));
        return this.user;
      }

      // Token is invalid, clear it
      this.logout();
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      this.logout();
      return null;
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await this.makeRequest('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      if (response.success) {
        this.user = response.user;
        localStorage.setItem('user', JSON.stringify(this.user));
        return { success: true, user: this.user };
      }

      throw new Error(response.error || 'Profile update failed');
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  // Get volunteers (for NGOs)
  async getVolunteers(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          if (Array.isArray(value)) {
            queryParams.append(key, value.join(','));
          } else {
            queryParams.append(key, value);
          }
        }
      });

      const url = `/api/users/volunteers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.makeRequest(url);

      if (response.success) {
        return response.data;
      }

      throw new Error(response.error || 'Failed to fetch volunteers');
    } catch (error) {
      console.error('Get volunteers error:', error);
      throw error;
    }
  }

  // Get NGOs (for volunteers)
  async getNGOs(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          if (Array.isArray(value)) {
            queryParams.append(key, value.join(','));
          } else {
            queryParams.append(key, value);
          }
        }
      });

      const url = `/api/users/ngos${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.makeRequest(url);

      if (response.success) {
        return response.data;
      }

      throw new Error(response.error || 'Failed to fetch NGOs');
    } catch (error) {
      console.error('Get NGOs error:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  // Get current user without API call
  getUser() {
    return this.user;
  }

  // Get token
  getToken() {
    return this.token;
  }

  // Logout user
  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Forgot password - send OTP
  async forgotPassword(email) {
    try {
      const response = await this.makeRequest('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (response.success) {
        return { success: true, message: response.message };
      }

      throw new Error(response.error || 'Failed to send OTP');
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  // Reset password - verify OTP and update password
  async resetPassword(email, otp, newPassword, confirmPassword) {
    try {
      const response = await this.makeRequest('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email,
          otp,
          newPassword,
          confirmPassword
        }),
      });

      if (response.success) {
        return { success: true, message: response.message };
      }

      throw new Error(response.error || 'Failed to reset password');
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  // Check server health
  async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Health check failed:', error);
      return { success: false, error: 'Server unreachable' };
    }
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;
