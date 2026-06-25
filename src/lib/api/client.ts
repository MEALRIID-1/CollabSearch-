import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};

  const rawAuthToken = Cookies.get('collabsearch_token');
  const authToken =
    rawAuthToken &&
    rawAuthToken !== 'undefined' &&
    rawAuthToken !== 'null'
      ? rawAuthToken
      : undefined;

  if (authToken) {
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }

  if (config.data instanceof FormData) {
    if (typeof (config.headers as any).delete === 'function') {
      (config.headers as any).delete('Content-Type');
      (config.headers as any).delete('content-type');
    } else {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default apiClient;
