import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { MOCK_DEMO_DATA } from './mockData';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const getMockResponseForUrl = (url: string = '') => {
  if (url.includes('/auth/refresh')) {
    return {
      data: {
        success: true,
        data: {
          accessToken: 'mock_demo_jwt_token_demo_user',
        },
      },
    };
  }
  if (url.includes('/analytics/dashboard')) return { data: { data: MOCK_DEMO_DATA.dashboard } };
  if (url.includes('/analytics/revenue')) return { data: { data: MOCK_DEMO_DATA.revenue } };
  if (url.includes('/analytics/sources')) return { data: { data: MOCK_DEMO_DATA.sources } };
  if (url.includes('/analytics/pipeline')) return { data: { data: MOCK_DEMO_DATA.pipeline } };
  if (url.includes('/leads')) return { data: { data: MOCK_DEMO_DATA.leads, meta: { total: MOCK_DEMO_DATA.leads.length, page: 1, totalPages: 1 } } };
  if (url.includes('/customers')) return { data: { data: MOCK_DEMO_DATA.customers, meta: { total: MOCK_DEMO_DATA.customers.length, page: 1, totalPages: 1 } } };
  if (url.includes('/deals')) return { data: { data: MOCK_DEMO_DATA.deals } };
  if (url.includes('/tasks')) return { data: { data: MOCK_DEMO_DATA.tasks } };
  if (url.includes('/activities')) return { data: { data: MOCK_DEMO_DATA.activities } };
  if (url.includes('/organizations/members')) return { data: { data: MOCK_DEMO_DATA.team } };
  if (url.includes('/billing/config-status')) return { data: { data: { isConfigured: true, mode: 'test' } } };
  if (url.includes('/billing')) return { data: { data: MOCK_DEMO_DATA.billing } };
  if (url.includes('/notifications')) return { data: { data: MOCK_DEMO_DATA.notifications, meta: { unreadCount: 2 } } };
  if (url.includes('/auth/me')) {
    return {
      data: {
        data: {
          user: MOCK_DEMO_DATA.user,
          currentOrganization: MOCK_DEMO_DATA.organization,
          organizations: [MOCK_DEMO_DATA.organization],
        },
      },
    };
  }
  return { data: { success: true, data: [] } };
};

// Request interceptor: attach token & organization id
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('cf_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const orgId = localStorage.getItem('cf_active_org_id');
    if (orgId && config.headers) {
      config.headers['x-organization-id'] = orgId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: auto-refresh on 401 & seamless demo fallback
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const token = localStorage.getItem('cf_access_token');
    const isDemo =
      token === 'mock_demo_jwt_token_sarah_jenkins' ||
      token === 'mock_demo_jwt_token_demo_user' ||
      Boolean(token && token.includes('mock_demo')) ||
      Boolean(originalRequest?.headers?.Authorization?.toString().includes('mock_demo'));

    // In demo mode or if server/database is offline, return rich mock CRM data seamlessly
    if (isDemo || error.code === 'ERR_NETWORK' || !error.response || error.response.status >= 500) {
      const mock = getMockResponseForUrl(originalRequest?.url);
      if (mock) {
        return Promise.resolve(mock as any);
      }
    }

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login') && !originalRequest.url?.includes('/auth/refresh')) {
      if (isDemo) {
        return Promise.resolve(getMockResponseForUrl(originalRequest?.url) as any);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = data.data.accessToken;
        localStorage.setItem('cf_access_token', newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('cf_access_token');
        localStorage.removeItem('cf_user');
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
          window.location.href = '/login?session_expired=true';
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
