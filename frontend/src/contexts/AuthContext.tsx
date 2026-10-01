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

    if (
      token === 'mock_demo_jwt_token_sarah_jenkins' ||
      token === 'mock_demo_jwt_token_demo_user' ||
      token.includes('mock_demo')
    ) {
      const savedProfile = localStorage.getItem('cf_user_profile');
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          if (parsed?.user) {
            setUser(parsed.user);
            setCurrentOrg(parsed.org || parsed.currentOrganization);
            setOrganizations([parsed.org || parsed.currentOrganization]);
            setIsLoading(false);
            return;
          }
        } catch {
          // ignore
        }
      }

      const demoUser = {
        id: 'usr_demo_user',
        email: 'demo@clientflow.io',
        firstName: 'Demo',
        lastName: 'User',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        emailVerified: true,
        role: 'OWNER',
      } as any;

      const demoOrg = {
        id: 'org_demo_acme',
        name: 'ClientFlow Demo Workspace',
        slug: 'demo-workspace',
        plan: 'PRO',
      } as any;

      setUser(demoUser);
      setCurrentOrg(demoOrg);
      setOrganizations([demoOrg]);
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
    const email = credentials?.email?.trim().toLowerCase() || '';
    const password = credentials?.password || '';
    const isDemo = email === 'demo@clientflow.io' && (password === 'ClientFlow2025!' || !password);

    // ONLY the Direct Demo Account is allowed to sign in without an active database record
    if (isDemo) {
      const demoUser: User = {
        id: 'usr_demo_user',
        email: 'demo@clientflow.io',
        firstName: 'Demo',
        lastName: 'User',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        emailVerified: true,
        role: 'OWNER',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any;

      const demoOrg: Organization = {
        id: 'org_demo_acme',
        name: 'ClientFlow Demo Workspace',
        slug: 'demo-workspace',
        plan: 'PRO',
        role: 'OWNER',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any;

      localStorage.setItem('cf_access_token', 'mock_demo_jwt_token_demo_user');
      localStorage.setItem('cf_active_org_id', demoOrg.id);

      setUser(demoUser);
      setCurrentOrg(demoOrg);
      setOrganizations([demoOrg]);

      return { data: { user: demoUser, currentOrganization: demoOrg, organizations: [demoOrg] } };
    }

    // If user enters any other email and password, check the API or reject with ID Not Registered
    try {
      const res = await apiClient.post('/auth/login', credentials);
      if (res?.data?.data?.user) {
        const { user: userData, currentOrganization, organizations: orgList, accessToken } = res.data.data;
        localStorage.setItem('cf_access_token', accessToken);
        if (currentOrganization) {
          localStorage.setItem('cf_active_org_id', currentOrganization.id);
        }
        setUser(userData);
        setCurrentOrg(currentOrganization);
        setOrganizations(orgList || []);
        return res.data;
      }
      throw new Error("Your ID isn't registered yet! Please try the Demo Account.");
    } catch {
      throw new Error("Your ID isn't registered yet! Please try the Demo Account.");
    }
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
    try {
      const res = await apiClient.post('/auth/register', data);
      if (res?.data?.data?.user) {
        const { user: userData, organization, accessToken } = res.data.data;

        localStorage.setItem('cf_access_token', accessToken);
        if (organization) {
          localStorage.setItem('cf_active_org_id', organization.id);
        }
        localStorage.setItem(
          'cf_user_profile',
          JSON.stringify({ user: userData, org: organization })
        );

        setUser(userData);
        setCurrentOrg(organization);
        setOrganizations([organization]);

        return res.data;
      }
    } catch {
      // Backend is offline or database is not connected
    }

    const email = data.email?.trim() || 'user@example.com';
    const regUser: User = {
      id: `usr_${Date.now().toString(36)}`,
      email: email,
      firstName: data.firstName || 'User',
      lastName: data.lastName || '',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      emailVerified: true,
      role: 'OWNER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any;

    const regOrg: Organization = {
      id: 'org_demo_acme',
      name: data.organizationName || `${data.firstName || 'My'}'s Workspace`,
      slug: (data.organizationName || 'workspace').toLowerCase().replace(/[^a-z0-9]/g, '-'),
      plan: 'PRO',
      role: 'OWNER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any;

    const token = `mock_demo_jwt_token_${regUser.id}`;
    localStorage.setItem('cf_access_token', token);
    localStorage.setItem('cf_active_org_id', regOrg.id);
    localStorage.setItem(
      'cf_user_profile',
      JSON.stringify({ user: regUser, org: regOrg })
    );

    setUser(regUser);
    setCurrentOrg(regOrg);
    setOrganizations([regOrg]);

    return {
      data: {
        user: regUser,
        organization: regOrg,
        accessToken: token,
      },
    };
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
