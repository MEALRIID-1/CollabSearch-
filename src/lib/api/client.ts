import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Intercepteur pour ajouter le token CSRF et le token d'authentification
apiClient.interceptors.request.use(async (config) => {
  config.headers = config.headers ?? {};

  const csrfToken = Cookies.get('XSRF-TOKEN');
  const rawAuthToken = Cookies.get('collabsearch_token');
  const authToken = rawAuthToken && rawAuthToken !== 'undefined' && rawAuthToken !== 'null' ? rawAuthToken : undefined;

  if (csrfToken) {
    config.headers['X-XSRF-TOKEN'] = decodeURIComponent(csrfToken);
  }

  if (authToken) {
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }

  if (config.data instanceof FormData) {
    if (config.headers && typeof (config.headers as any).delete === 'function') {
      (config.headers as any).delete('Content-Type');
      (config.headers as any).delete('content-type');
    } else {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
  }

  return config;
});


// Intercepteur pour gérer les erreurs 401
// Note: on ne supprime pas le cookie ici — checkAuth() dans auth-store gère la déconnexion
apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export async function getCsrfCookie(): Promise<void> {
  await axios.get(`${API_BASE_URL}/sanctum/csrf-cookie`, {
    withCredentials: true,
  });
}

export default apiClient;
