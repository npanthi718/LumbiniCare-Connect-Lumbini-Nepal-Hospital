import axios from 'axios';

const baseURL =
  (typeof import.meta !== 'undefined' && (
    import.meta.env?.VITE_API_BASE ||
    import.meta.env?.VITE_APP_API_BASE
  )) || '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  }
});

try {
  console.log('API baseURL:', baseURL);
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn('API baseURL log failed');
}

let pendingRequests = 0;
const emitLoadingEvent = () => {
  const isLoading = pendingRequests > 0;
  const ev = new CustomEvent('global-loading', { detail: { loading: isLoading, count: pendingRequests } });
  window.dispatchEvent(ev);
};

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    pendingRequests += 1;
    emitLoadingEvent();
    return config;
  },
  (error) => {
    pendingRequests = Math.max(0, pendingRequests - 1);
    emitLoadingEvent();
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    pendingRequests = Math.max(0, pendingRequests - 1);
    emitLoadingEvent();
    return response;
  },
  (error) => {
    pendingRequests = Math.max(0, pendingRequests - 1);
    emitLoadingEvent();
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api; 
