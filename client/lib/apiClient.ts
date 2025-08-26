// FILE: client/lib/apiClient.ts
// DESCRIPTION: Centralized Axios instance for making API calls.
// It automatically attaches the access token and handles token refresh logic.

import axios from 'axios';
import Router from 'next/router';

// The base URL for all API requests
const baseURL = '/api';

const apiClient = axios.create({
  baseURL,
});

// --- Request Interceptor ---
// This runs BEFORE each request is sent.
apiClient.interceptors.request.use(
  (config) => {
    // 1. Get the access token from localStorage.
    const token = localStorage.getItem('accessToken');
    
    // 2. If the token exists, add it to the Authorization header.
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Response Interceptor ---
// This runs AFTER a response is received.
let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void, reject: (error: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    // If the request was successful, just return the response.
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 1. Check if the error is due to an expired token (status 403 from our middleware).
    if (error.response?.status === 403 && !originalRequest._retry) {
      if (isRefreshing) {
        // If a refresh is already in progress, queue the request.
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return axios(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        // If no refresh token, logout the user.
        // You might want to redirect to login page here.
        console.error("No refresh token available.");
        // Example: Router.push('/login');
        return Promise.reject(error);
      }
      
      try {
        // 2. Call the refresh token API endpoint.
        const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
        
        // 3. Update the stored access token.
        localStorage.setItem('accessToken', data.accessToken);
        
        // 4. Update the header of the original request and retry it.
        apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + data.accessToken;
        originalRequest.headers['Authorization'] = 'Bearer ' + data.accessToken;
        processQueue(null, data.accessToken);
        
        return apiClient(originalRequest);

      } catch (refreshError) {
        // If refreshing fails, the refresh token is likely invalid.
        // Clear tokens and redirect to login.
        console.error("Refresh token failed:", refreshError);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        processQueue(refreshError, null);
        
        // Example: Router.push('/login');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;