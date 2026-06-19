import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import Cookies from 'js-cookie';

let echo: Echo<any> | null = null;

function getAuthHeaders() {
  const csrfToken = Cookies.get('XSRF-TOKEN');

  return {
    Accept: 'application/json',
    ...(csrfToken ? { 'X-XSRF-TOKEN': decodeURIComponent(csrfToken) } : {}),
  };
}

export function getEcho(): Echo<any> | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (echo) {
    return echo;
  }

  const key = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
  const host = process.env.NEXT_PUBLIC_PUSHER_HOST || window.location.hostname;
  const port = Number(process.env.NEXT_PUBLIC_PUSHER_PORT || 6001);
  const scheme = process.env.NEXT_PUBLIC_PUSHER_SCHEME || (window.location.protocol === 'https:' ? 'https' : 'http');
  const forceTLS = scheme === 'https';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;

  if (!key) {
    return null;
  }

  echo = new Echo({
    broadcaster: 'pusher',
    key,
    cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER,
    wsHost: host,
    wsPort: port,
    wssPort: port,
    forceTLS,
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${apiUrl}/broadcasting/auth`,
    auth: {
      headers: getAuthHeaders(),
    },
  });

  return echo;
}
