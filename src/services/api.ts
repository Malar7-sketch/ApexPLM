import type { UserAccount } from '../data/mockUsers';
import type { Project, BOMNode, EngineeringDocument, QualityNCR, AuditLog, PartItem } from '../types/plm';

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://apexplm.onrender.com' : 'http://localhost:5000')
).replace(/\/$/, '');

const BASE_URL = API_BASE_URL;

// Token and Session management with localStorage + sessionStorage redundancy (3-Hour Lifetime)
const TOKEN_KEY = 'apex_plm_auth_token';
const USER_KEY = 'apex_plm_current_user';
const TAB_KEY = 'apex_plm_active_tab';

export const decodeJwt = (token: string): { id?: string; employeeId?: string; exp?: number; iat?: number; [key: string]: any } | null => {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string | null | undefined): boolean => {
  if (!token) return false;
  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp !== 'number') return false;
  // payload.exp is in seconds, Date.now() is in milliseconds
  return Date.now() >= payload.exp * 1000;
};

export const generateClientJwt = (user: UserAccount): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const nowSec = Math.floor(Date.now() / 1000);
  const expSec = nowSec + 3 * 3600; // Exact 3-hour lifetime (10,800 seconds)
  const payload = btoa(JSON.stringify({
    id: user.id || user.employeeId,
    employeeId: user.employeeId,
    name: user.name,
    email: user.email,
    role: user.systemRole,
    iat: nowSec,
    exp: expSec
  }));
  return `${header}.${payload}.apexplm_client_sig`;
};

export const getAuthToken = (): string | null => {
  try {
    const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    if (isTokenExpired(token)) {
      console.warn('[ApexPLM Auth] JWT token has expired (3-hour lifetime reached).');
      clearAllSessionData();
      return null;
    }
    return token;
  } catch {
    return null;
  }
};

export const setAuthToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.warn('Failed to save auth token:', e);
  }
};

export const clearAuthToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.warn('Failed to clear auth token:', e);
  }
};

export const getStoredUser = (): UserAccount | null => {
  try {
    const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    if (token && isTokenExpired(token)) {
      clearAllSessionData();
      return null;
    }
    const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && parsed.email ? parsed : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: UserAccount): void => {
  try {
    const serialized = JSON.stringify(user);
    localStorage.setItem(USER_KEY, serialized);
    sessionStorage.setItem(USER_KEY, serialized);
  } catch (e) {
    console.error('Failed to store user session:', e);
  }
};

export const clearStoredUser = (): void => {
  try {
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);
  } catch (e) {
    console.warn('Failed to clear stored user:', e);
  }
};

export const getStoredActiveTab = (): string | null => {
  try {
    const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    if (token && isTokenExpired(token)) {
      return null;
    }
    return localStorage.getItem(TAB_KEY) || sessionStorage.getItem(TAB_KEY);
  } catch {
    return null;
  }
};

export const setStoredActiveTab = (tab: string): void => {
  try {
    localStorage.setItem(TAB_KEY, tab);
    sessionStorage.setItem(TAB_KEY, tab);
  } catch (e) {
    console.warn('Failed to save active tab:', e);
  }
};

export const clearStoredActiveTab = (): void => {
  try {
    localStorage.removeItem(TAB_KEY);
    sessionStorage.removeItem(TAB_KEY);
  } catch (e) {
    console.warn('Failed to clear active tab:', e);
  }
};

export const clearAllSessionData = (): void => {
  clearAuthToken();
  clearStoredUser();
  clearStoredActiveTab();
};

// Centralized request wrapper with timeout and robust error resilience
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = 12000
): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
    clearTimeout(timeoutId);

    // If deleting and server says 404, treat as idempotent success
    if (res.status === 404 && options.method === 'DELETE') {
      return { success: true, message: 'Already deleted or not found in database.' } as T;
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // ONLY clear session if server returned 401 AND the token has actually expired
      if (res.status === 401 && !endpoint.includes('/auth/login')) {
        const currentToken = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
        if (isTokenExpired(currentToken)) {
          console.warn('[ApexPLM Auth] 401 received and token has expired. Clearing session.');
          clearAllSessionData();
        }
      }

      const errorMsg = data.message || `API Error: ${res.status} ${res.statusText}`;
      const err = new Error(errorMsg);
      (err as any).status = res.status;
      (err as any).data = data;
      throw err;
    }

    return data as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.warn(`[ApexPLM API] Request to ${endpoint} timed out after ${timeoutMs}ms.`);
    } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
      console.warn(`[ApexPLM API] Connection to ${BASE_URL} failed. Ensure backend is running.`);
    }
    throw err;
  }
}

// 1. Authentication Service
export const authApi = {
  login: async (credentials: { email?: string; employeeId?: string; password: string }) => {
    const res = await apiFetch<{ success: boolean; token: string; user: UserAccount }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res.token) {
      setAuthToken(res.token);
    }
    if (res.user) {
      setStoredUser(res.user);
    }
    return res;
  },
  getMe: async () => {
    const res = await apiFetch<{ success: boolean; user: UserAccount }>('/api/auth/me');
    if (res.user) {
      setStoredUser(res.user);
    }
    return res.user;
  },
  logout: () => {
    clearAllSessionData();
  },
};

// 2. User Management Service (Admin)
export const usersApi = {
  getAll: async () => {
    const res = await apiFetch<{ success: boolean; users: UserAccount[] }>('/api/users');
    return res.users || [];
  },
  getById: async (id: string) => {
    const res = await apiFetch<{ success: boolean; user: UserAccount }>(`/api/users/${id}`);
    return res.user;
  },
  create: async (userData: Partial<UserAccount> & { password?: string }) => {
    const res = await apiFetch<{ success: boolean; user: UserAccount; message: string }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return res.user;
  },
  update: async (id: string, userData: Partial<UserAccount>) => {
    const res = await apiFetch<{ success: boolean; user: UserAccount; message: string }>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    return res.user;
  },
  delete: async (id: string) => {
    return apiFetch<{ success: boolean; message: string; deletedId: string }>(`/api/users/${id}`, {
      method: 'DELETE',
    });
  },
  block: async (id: string) => {
    const res = await apiFetch<{ success: boolean; user: UserAccount }>(`/api/users/${id}/block`, {
      method: 'PATCH',
    });
    return res.user;
  },
  unblock: async (id: string) => {
    const res = await apiFetch<{ success: boolean; user: UserAccount }>(`/api/users/${id}/unblock`, {
      method: 'PATCH',
    });
    return res.user;
  },
  resetPassword: async (id: string, newPassword: string) => {
    return apiFetch<{ success: boolean; message: string }>(`/api/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  },
};

// 3. Project Management Service (Single Source of Truth)
export const projectsApi = {
  getAll: async () => {
    const res = await apiFetch<{ success: boolean; projects: Project[] }>('/api/projects');
    return res.projects || [];
  },
  getById: async (id: string) => {
    const res = await apiFetch<{ success: boolean; project: Project }>(`/api/projects/${id}`);
    return res.project;
  },
  create: async (projectData: Partial<Project>) => {
    const payload = { ...projectData };
    if (payload.status) {
      if (['Completed', 'Closed'].includes(payload.status)) {
        payload.status = 'Completed';
      } else if (['At Risk', 'Delayed', 'Critical', 'Completed'].includes(payload.status)) {
        // Keep as-is
      } else {
        // Map 'Not Started', 'In Progress' or custom values to 'On Track'
        payload.status = 'On Track';
      }
    } else {
      payload.status = 'On Track';
    }

    const res = await apiFetch<{ success: boolean; project: Project; message: string }>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.project;
  },
  update: async (id: string, projectData: Partial<Project>) => {
    const payload = { ...projectData };
    if (payload.status) {
      if (['Completed', 'Closed'].includes(payload.status)) {
        payload.status = 'Completed';
      } else if (['At Risk', 'Delayed', 'Critical', 'Completed'].includes(payload.status)) {
        // Keep as-is
      } else {
        payload.status = 'On Track';
      }
    }
    const res = await apiFetch<{ success: boolean; project: Project; message: string }>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.project;
  },
  delete: async (id: string) => {
    return apiFetch<{ success: boolean; message: string; deletedId: string; deletedCode: string }>(
      `/api/projects/${id}`,
      {
        method: 'DELETE',
      }
    );
  },
  getBOM: async (projectId: string) => {
    const res = await apiFetch<{ success: boolean; bom: { rootNode: BOMNode } }>(`/api/projects/${projectId}/bom`);
    return res.bom?.rootNode;
  },
  saveBOM: async (projectId: string, partId: string, rootNode: BOMNode) => {
    const res = await apiFetch<{ success: boolean; bom: any }>(`/api/projects/${projectId}/bom`, {
      method: 'POST',
      body: JSON.stringify({ partId, rootNode, projectId }),
    });
    return res.bom;
  },
};

// 4. BOM Management Service
export const bomApi = {
  getAll: async () => {
    const res = await apiFetch<{ success: boolean; boms: { partId: string; rootNode: BOMNode }[] }>('/api/bom');
    const map: Record<string, BOMNode> = {};
    if (res.boms) {
      res.boms.forEach((b) => {
        if (b.partId && b.rootNode) map[b.partId] = b.rootNode;
      });
    }
    return map;
  },
  getByPartId: async (partId: string) => {
    const res = await apiFetch<{ success: boolean; bom: { rootNode: BOMNode } }>(`/api/bom/${partId}`);
    return res.bom?.rootNode;
  },
  save: async (partId: string, rootNode: BOMNode, projectId?: string) => {
    const res = await apiFetch<{ success: boolean; bom: any }>('/api/bom', {
      method: 'POST',
      body: JSON.stringify({ partId, rootNode, projectId }),
    });
    return res.bom;
  },
  delete: async (idOrPartId: string) => {
    return apiFetch<{ success: boolean; message: string }>(`/api/bom/${idOrPartId}`, {
      method: 'DELETE',
    });
  },
};

// 5. Document Management Service
export const documentsApi = {
  getAll: async (projectId?: string, partId?: string, revision?: string) => {
    const params = new URLSearchParams();
    if (projectId) params.set('projectId', projectId);
    if (partId) params.set('partId', partId);
    if (revision) params.set('revision', revision);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiFetch<{ success: boolean; documents: EngineeringDocument[] }>(`/api/documents${query}`);
    return res.documents || [];
  },
  getById: async (id: string) => {
    const res = await apiFetch<{ success: boolean; document: EngineeringDocument }>(`/api/documents/${id}`);
    return res.document;
  },
  create: async (docData: Partial<EngineeringDocument>) => {
    const res = await apiFetch<{ success: boolean; document: EngineeringDocument }>('/api/documents', {
      method: 'POST',
      body: JSON.stringify(docData),
    });
    return res.document;
  },
  update: async (id: string, docData: Partial<EngineeringDocument>) => {
    const res = await apiFetch<{ success: boolean; document: EngineeringDocument }>(`/api/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(docData),
    });
    return res.document;
  },
  delete: async (id: string) => {
    return apiFetch<{ success: boolean; message: string; deletedId: string }>(`/api/documents/${id}`, {
      method: 'DELETE',
    });
  },
};

// 6. Quality / NCR Management Service
export const ncrsApi = {
  getAll: async (projectId?: string) => {
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    const res = await apiFetch<{ success: boolean; ncrs: QualityNCR[] }>(`/api/ncrs${query}`);
    return res.ncrs || [];
  },
  getById: async (id: string) => {
    const res = await apiFetch<{ success: boolean; ncr: QualityNCR }>(`/api/ncrs/${id}`);
    return res.ncr;
  },
  create: async (ncrData: Partial<QualityNCR>) => {
    const res = await apiFetch<{ success: boolean; ncr: QualityNCR }>('/api/ncrs', {
      method: 'POST',
      body: JSON.stringify(ncrData),
    });
    return res.ncr;
  },
  update: async (id: string, ncrData: Partial<QualityNCR>) => {
    const res = await apiFetch<{ success: boolean; ncr: QualityNCR }>(`/api/ncrs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(ncrData),
    });
    return res.ncr;
  },
  delete: async (id: string) => {
    return apiFetch<{ success: boolean; message: string; deletedId: string }>(`/api/ncrs/${id}`, {
      method: 'DELETE',
    });
  },
};

// 7. Audit Log Service
export const auditLogsApi = {
  getAll: async (limit = 200) => {
    const res = await apiFetch<{ success: boolean; auditLogs: AuditLog[] }>(`/api/audit-logs?limit=${limit}`);
    return res.auditLogs || [];
  },
  create: async (logData: Partial<AuditLog>) => {
    const res = await apiFetch<{ success: boolean; auditLog: AuditLog }>('/api/audit-logs', {
      method: 'POST',
      body: JSON.stringify(logData),
    });
    return res.auditLog;
  },
};

// 8. Item Master / Parts Service
export const partsApi = {
  getAll: async (projectId?: string) => {
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    const res = await apiFetch<{ success: boolean; parts: PartItem[] }>(`/api/parts${query}`);
    return res.parts || [];
  },
  create: async (partData: Partial<PartItem>) => {
    const res = await apiFetch<{ success: boolean; part: PartItem }>('/api/parts', {
      method: 'POST',
      body: JSON.stringify(partData),
    });
    return res.part;
  },
  update: async (id: string, partData: Partial<PartItem>) => {
    const res = await apiFetch<{ success: boolean; part: PartItem }>(`/api/parts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(partData),
    });
    return res.part;
  },
  delete: async (id: string) => {
    return apiFetch<{ success: boolean; message: string; deletedId: string }>(`/api/parts/${id}`, {
      method: 'DELETE',
    });
  },
};
