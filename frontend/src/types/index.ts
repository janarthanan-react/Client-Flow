export type Role = 'OWNER' | 'ADMIN' | 'SALES' | 'MEMBER';

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'UNQUALIFIED';

export type LeadSource = 'WEBSITE' | 'REFERRAL' | 'LINKEDIN' | 'COLD_OUTREACH' | 'INBOUND' | 'OTHER';

export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'CHURNED';

export type DealStage = 'PROSPECTING' | 'QUALIFICATION' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type ActivityType = 'NOTE' | 'CALL' | 'EMAIL' | 'MEETING' | 'STATUS_CHANGE';

export type SubscriptionPlan = 'FREE' | 'PRO' | 'BUSINESS';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  emailVerified: boolean;
  createdAt?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  plan: SubscriptionPlan;
  role?: Role;
  stripeCustomerId?: string | null;
}

export interface OrganizationMember {
  id: string;
  userId: string;
  role: Role;
  joinedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
    emailVerified: boolean;
  };
}

export interface Lead {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  title?: string | null;
  status: LeadStatus;
  source: LeadSource;
  estimatedValue: number;
  assignedToUserId?: string | null;
  assignedToUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
  convertedCustomer?: {
    id: string;
    name: string;
    email: string;
  } | null;
  tasks?: Task[];
  activities?: Activity[];
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  organizationId: string;
  name: string;
  company?: string | null;
  email: string;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  status: CustomerStatus;
  convertedFromLeadId?: string | null;
  totalRevenue?: number;
  totalPipeline?: number;
  deals?: Deal[];
  tasks?: Task[];
  activities?: Activity[];
  _count?: {
    deals: number;
    tasks: number;
    activities: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: string;
  organizationId: string;
  customerId: string;
  title: string;
  amount: number;
  stage: DealStage;
  probability: number;
  expectedCloseDate?: string | null;
  assignedToUserId?: string | null;
  customer?: {
    id: string;
    name: string;
    company?: string | null;
    email: string;
  };
  assignedToUser?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  } | null;
  activities?: Activity[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  organizationId: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  assignedToUserId?: string | null;
  leadId?: string | null;
  customerId?: string | null;
  assignedToUser?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  } | null;
  lead?: {
    id: string;
    firstName: string;
    lastName: string;
    company?: string | null;
  } | null;
  customer?: {
    id: string;
    name: string;
    company?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  organizationId: string;
  type: ActivityType;
  title: string;
  description?: string | null;
  performedByUserId: string;
  leadId?: string | null;
  customerId?: string | null;
  dealId?: string | null;
  performedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
  lead?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  customer?: {
    id: string;
    name: string;
  } | null;
  deal?: {
    id: string;
    title: string;
    amount: number;
  } | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  organizationId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
  createdAt: string;
}

export interface DashboardMetrics {
  totalLeads: number;
  qualifiedLeads: number;
  totalCustomers: number;
  openDealsCount: number;
  totalRevenue: number;
  totalPipelineValue: number;
  conversionRate: number;
  winRate: number;
}

export interface DashboardAnalytics {
  metrics: DashboardMetrics;
  recentLeads: Lead[];
  recentActivities: Activity[];
  upcomingTasks: Task[];
}

export interface BillingDetails {
  plan: SubscriptionPlan;
  status: string;
  stripeCustomerId?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd: boolean;
  usage: {
    leads: {
      used: number;
      limit: number;
      percentage: number;
    };
    members: {
      used: number;
      limit: number;
      percentage: number;
    };
  };
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    receiptUrl?: string | null;
    createdAt: string;
  }>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, any>;
  errors?: Array<{ field?: string; message: string }>;
}
