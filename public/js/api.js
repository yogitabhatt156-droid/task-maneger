/**
 * TaskFlow Centralized API Client
 */

const API_BASE = '/api';

class ApiClient {
  async request(endpoint, options = {}) {
    const token = await getAuthToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);

      // Handle session expiry or unauthorized
      if (response.status === 401) {
        localStorage.removeItem('taskflow_auth_session');
        window.location.href = '/login.html';
        throw new Error('Session expired. Please log in again.');
      }

      const json = await response.json();

      if (!response.ok || !json.success) {
        const errorMsg = json.message || 'An unexpected error occurred.';
        throw new Error(errorMsg);
      }

      return json;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  }

  get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Domain APIs
  tasks = {
    getAll: (filters = {}) => this.get('/tasks', filters),
    getById: (id) => this.get(`/tasks/${id}`),
    create: (data) => this.post('/tasks', data),
    update: (id, data) => this.put(`/tasks/${id}`, data),
    delete: (id) => this.delete(`/tasks/${id}`),
  };

  categories = {
    getAll: () => this.get('/categories'),
    create: (data) => this.post('/categories', data),
    update: (id, data) => this.put(`/categories/${id}`, data),
    delete: (id) => this.delete(`/categories/${id}`),
  };

  dashboard = {
    getStats: () => this.get('/dashboard'),
  };

  tags = {
    getAll: () => this.get('/tags'),
  };
}

const api = new ApiClient();
