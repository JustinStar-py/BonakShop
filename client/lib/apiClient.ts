// FILE: client/lib/apiClient.ts
// DESCRIPTION: Centralized Axios instance for making API calls.
// It automatically attaches the access token and handles token refresh logic.

import axios from 'axios';
import Router from 'next/router';
import { loaderState } from '@/lib/loaderSignal';

// The base URL for all API requests
const baseURL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : '/api';

const apiClient = axios.create({
  baseURL,
  withCredentials: true, // Important for sending/receiving cookies
});

// --- Request Interceptor ---
// This runs BEFORE each request is sent.
apiClient.interceptors.request.use(
  (config) => {
    loaderState.start();
    // 1. Get the access token from localStorage.
    const token = localStorage.getItem('accessToken');
    
    // 2. If the token exists, add it to the Authorization header.
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    loaderState.complete();
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
    loaderState.complete();
    // If the request was successful, just return the response.
    return response;
  },
  async (error) => {
    loaderState.complete();
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
      
      // Note: Refresh token is now in an httpOnly cookie, handled automatically by the browser.
      
      try {
        // 2. Call the refresh token API endpoint. 
        // We don't send the refresh token in the body anymore; the cookie is sent automatically.
        const { data } = await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
        
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
        // No need to remove refreshToken from localStorage as it's not there.
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