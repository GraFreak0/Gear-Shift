import axios from 'axios';
import { appParams } from '@/lib/app-params';

const { appBaseUrl } = appParams;

// Create an axios instance with base URL and default configuration
export const apiClient = axios.create({
  baseURL: appBaseUrl || '',
  headers: {
    'Content-Type': 'application/json',
    'X-App-Id': appParams.appId
  }
});

// Add a request interceptor to include the token if available
apiClient.interceptors.request.use((config) => {
  const token = appParams.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default apiClient;
