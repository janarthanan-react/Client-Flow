import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { User, Organization } from '../types';

interface AuthContextType {
  user: User | null;
  currentOrg: Organization | null;
  organizations: Organization[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: any) => Promise<any>;
  loginWithGoogle: (credential: string) => Promise<any>;
  register: (data: any) => Promise<any>;
  logout: () => Promise<void>;
  switchOrganization: (orgId: string) => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUserData = useCallback(async () => {
    const token = localStorage.getItem('cf_access_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiClient.get('/auth/me');
      const { user: userData, currentOrganization, organizations: orgList } = res.data.data;
      setUser(userData);
      setOrganizations(orgList || []);

      const savedOrgId = localStorage.getItem('cf_active_org_id');
      const matchingOrg = orgList?.find((o: Organization) => o.id === savedOrgId);

      if (matchingOrg) {
        setCurrentOrg(matchingOrg);
      } else if (currentOrganization) {
        setCurrentOrg(currentOrganization);
        localStorage.setItem('cf_active_org_id', currentOrganization.id);
      }
    } catch {
      localStorage.removeItem('cf_access_token');
      localStorage.removeItem('cf_active_org_id');
      setUser(null);
      setCurrentOrg(null);
      setOrganizations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const login = async (credentials: any) => {
    const res = await apiClient.post('/auth/login', credentials);
    const { user: userData, currentOrganization, organizations: orgList, accessToken } = res.data.data;

    localStorage.setItem('cf_access_token', accessToken);
    if (currentOrganization) {
      localStorage.setItem('cf_active_org_id', currentOrganization.id);
    }

    setUser(userData);
    setCurrentOrg(currentOrganization);
    setOrganizations(orgList || []);

    return res.data;
  };

  const loginWithGoogle = async (credential: string) => {
    const res = await apiClient.post('/auth/google', { credential });
    const { user: userData, currentOrganization, organizations: orgList, accessToken } = res.data.data;

    localStorage.setItem('cf_access_token', accessToken);
    if (currentOrganization) {
      localStorage.setItem('cf_active_org_id', currentOrganization.id);
    }

    setUser(userData);
    setCurrentOrg(currentOrganization);
    setOrganizations(orgList || []);

    return res.data;
  };

  const register = async (data: any) => {
    const res = await apiClient.post('/auth/register', data);
    const { user: userData, organization, accessToken } = res.data.data;

    localStorage.setItem('cf_access_token', accessToken);
    if (organization) {
      localStorage.setItem('cf_active_org_id', organization.id);
    }

    setUser(userData);
    setCurrentOrg(organization);
    setOrganizations([organization]);

    return res.data;
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('cf_access_token');
      localStorage.removeItem('cf_active_org_id');
      setUser(null);
      setCurrentOrg(null);
      setOrganizations([]);
      window.location.href = '/login';
    }
  };

  const switchOrganization = (orgId: string) => {
    const target = organizations.find((o) => o.id === orgId);
    if (target) {
      setCurrentOrg(target);
      localStorage.setItem('cf_active_org_id', target.id);
      window.location.reload();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentOrg,
        organizations,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        switchOrganization,
        refreshUserData: fetchUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
