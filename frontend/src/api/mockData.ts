// Rich, realistic mock dataset for ClientFlow Demo Account (Demo User)
export const MOCK_DEMO_DATA = {
  user: {
    id: 'usr_demo_user',
    email: 'demo@clientflow.io',
    firstName: 'Demo',
    lastName: 'User',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    emailVerified: true,
    role: 'OWNER',
    createdAt: new Date().toISOString(),
  },

  organization: {
    id: 'org_demo_acme',
    name: 'ClientFlow Demo Workspace',
    slug: 'demo-workspace',
    logoUrl: null,
    plan: 'PRO',
    role: 'OWNER',
    createdAt: new Date().toISOString(),
  },

  dashboard: {
    metrics: {
      totalLeads: 48,
      qualifiedLeads: 22,
      totalCustomers: 24,
      openDealsCount: 18,
      totalRevenue: 184500,
      totalPipelineValue: 645000,
      conversionRate: 46.8,
      winRate: 72.4,
    },
    recentLeads: [
      { id: 'lead_1', firstName: 'Marcus', lastName: 'Sterling', company: 'Vanguard Technologies', email: 'marcus@vanguardtech.io', status: 'NEW', estimatedValue: 28000, createdAt: new Date(Date.now() - 1 * 3600000).toISOString() },
      { id: 'lead_2', firstName: 'Jessica', lastName: 'Alvarez', company: 'CloudScale Solutions', email: 'jalvarez@cloudscale.net', status: 'CONTACTED', estimatedValue: 42000, createdAt: new Date(Date.now() - 3 * 3600000).toISOString() },
      { id: 'lead_3', firstName: 'Liam', lastName: 'Thorne', company: 'FinFlow Global', email: 'liam@finflow.co', status: 'QUALIFIED', estimatedValue: 75000, createdAt: new Date(Date.now() - 6 * 3600000).toISOString() },
      { id: 'lead_4', firstName: 'Sophia', lastName: 'Chen', company: 'Nexus AI Labs', email: 'sophia.c@nexusai.com', status: 'PROPOSAL', estimatedValue: 56000, createdAt: new Date(Date.now() - 11 * 3600000).toISOString() },
      { id: 'lead_5', firstName: 'Amara', lastName: 'Okafor', company: 'Stride Software Group', email: 'amara@stridesoft.com', status: 'NEW', estimatedValue: 31500, createdAt: new Date(Date.now() - 22 * 3600000).toISOString() },
    ],
    recentActivities: [
      { id: 'act_1', type: 'DEAL_WON', title: 'Global Cloud Modernization Closed ($95,000)', description: 'Signed multi-year agreement received from Vanguard Technologies.', createdAt: new Date(Date.now() - 1 * 3600000).toISOString() },
      { id: 'act_2', type: 'MEETING', title: 'Quarterly Executive Alignment Call', description: 'Met with Chief Product Officer & VP Operations at FinFlow Global.', createdAt: new Date(Date.now() - 4 * 3600000).toISOString() },
      { id: 'act_3', type: 'EMAIL', title: 'Sent Enterprise Proposal to CloudScale', description: 'Delivered custom SLA proposal with volume tier discounts.', createdAt: new Date(Date.now() - 8 * 3600000).toISOString() },
      { id: 'act_4', type: 'CALL', title: 'Discovery Session with Nexus AI Labs', description: 'Mapped out CRM automated lead routing workflow requirements.', createdAt: new Date(Date.now() - 16 * 3600000).toISOString() },
    ],
    upcomingTasks: [
      { id: 'task_1', title: 'Finalize enterprise contract terms with Marcus Sterling', priority: 'HIGH', status: 'TODO', dueDate: new Date(Date.now() + 86400000).toISOString() },
      { id: 'task_2', title: 'Send security compliance report to CloudScale legal team', priority: 'URGENT', status: 'IN_PROGRESS', dueDate: new Date(Date.now() + 172800000).toISOString() },
      { id: 'task_3', title: 'Conduct quarterly pipeline review with sales engineering', priority: 'MEDIUM', status: 'TODO', dueDate: new Date(Date.now() + 259200000).toISOString() },
      { id: 'task_4', title: 'Review automated lead scoring rules for inbound web forms', priority: 'LOW', status: 'TODO', dueDate: new Date(Date.now() + 345600000).toISOString() },
    ],
  },

  revenue: [
    { month: 'Oct', revenue: 74000, target: 70000 },
    { month: 'Nov', revenue: 98000, target: 90000 },
    { month: 'Dec', revenue: 125000, target: 110000 },
    { month: 'Jan', revenue: 142000, target: 130000 },
    { month: 'Feb', revenue: 168000, target: 155000 },
    { month: 'Mar', revenue: 184500, target: 175000 },
  ],

  sources: [
    { name: 'Website Inbound', count: 20, percentage: 42 },
    { name: 'LinkedIn Outreach', count: 14, percentage: 29 },
    { name: 'Executive Referral', count: 9, percentage: 19 },
    { name: 'Tech Events & Conferences', count: 5, percentage: 10 },
  ],

  pipeline: [
    { stage: 'PROSPECTING', count: 5, value: 245000 },
    { stage: 'QUALIFICATION', count: 4, value: 188000 },
    { stage: 'PROPOSAL', count: 4, value: 215000 },
    { stage: 'NEGOTIATION', count: 3, value: 168000 },
    { stage: 'CLOSED_WON', count: 6, value: 312000 },
  ],

  leads: [
    { id: 'l1', firstName: 'Marcus', lastName: 'Sterling', company: 'Vanguard Technologies', email: 'marcus@vanguardtech.io', phone: '+1 (555) 234-5678', title: 'VP of Engineering', status: 'NEW', source: 'WEBSITE', estimatedValue: 28000, createdAt: new Date(Date.now() - 1 * 3600000).toISOString() },
    { id: 'l2', firstName: 'Jessica', lastName: 'Alvarez', company: 'CloudScale Solutions', email: 'jalvarez@cloudscale.net', phone: '+1 (555) 345-6789', title: 'Head of Operations', status: 'CONTACTED', source: 'LINKEDIN', estimatedValue: 42000, createdAt: new Date(Date.now() - 3 * 3600000).toISOString() },
    { id: 'l3', firstName: 'Liam', lastName: 'Thorne', company: 'FinFlow Global', email: 'liam@finflow.co', phone: '+1 (555) 456-7890', title: 'Chief Product Officer', status: 'QUALIFIED', source: 'REFERRAL', estimatedValue: 75000, createdAt: new Date(Date.now() - 6 * 3600000).toISOString() },
    { id: 'l4', firstName: 'Sophia', lastName: 'Chen', company: 'Nexus AI Labs', email: 'sophia.c@nexusai.com', phone: '+1 (555) 567-8901', title: 'Director of Growth', status: 'PROPOSAL', source: 'INBOUND', estimatedValue: 56000, createdAt: new Date(Date.now() - 11 * 3600000).toISOString() },
    { id: 'l5', firstName: 'Bradley', lastName: 'Cooper', company: 'Apex Digital Media', email: 'bcooper@apexmedia.agency', phone: '+1 (555) 890-1234', title: 'CEO', status: 'QUALIFIED', source: 'REFERRAL', estimatedValue: 38000, createdAt: new Date(Date.now() - 19 * 3600000).toISOString() },
    { id: 'l6', firstName: 'Daniel', lastName: 'Kaufman', company: 'Quantum Retail Group', email: 'dkaufman@quantumretail.de', phone: '+49 30 2345678', title: 'Head of E-commerce', status: 'PROPOSAL', source: 'INBOUND', estimatedValue: 64000, createdAt: new Date(Date.now() - 26 * 3600000).toISOString() },
    { id: 'l7', firstName: 'Felix', lastName: 'Baumgartner', company: 'Stratosphere Aerospace', email: 'felix@stratosphere.aero', phone: '+1 (555) 012-3456', title: 'Procurement Specialist', status: 'CONTACTED', source: 'COLD_OUTREACH', estimatedValue: 85000, createdAt: new Date(Date.now() - 32 * 3600000).toISOString() },
    { id: 'l8', firstName: 'Grace', lastName: 'Hopper', company: 'Compiler Security', email: 'ghopper@compilersec.io', phone: '+1 (555) 123-4567', title: 'Chief Architect', status: 'QUALIFIED', source: 'REFERRAL', estimatedValue: 48000, createdAt: new Date(Date.now() - 40 * 3600000).toISOString() },
    { id: 'l9', firstName: 'Lucas', lastName: 'Vance', company: 'Hyperloop Ventures', email: 'lucas@hyperloop.io', phone: '+1 (555) 456-1122', title: 'Managing Partner', status: 'NEW', source: 'WEBSITE', estimatedValue: 60000, createdAt: new Date(Date.now() - 48 * 3600000).toISOString() },
    { id: 'l10', firstName: 'Olivia', lastName: 'Wilde', company: 'Beacon Legal Partners', email: 'olivia@beaconlegal.law', phone: '+1 (555) 789-4455', title: 'Managing Attorney', status: 'PROPOSAL', source: 'INBOUND', estimatedValue: 45000, createdAt: new Date(Date.now() - 54 * 3600000).toISOString() },
  ],

  customers: [
    { id: 'c1', name: 'Apex Horizons Inc', company: 'Apex Horizons Inc', email: 'billing@apexhorizons.com', phone: '+1 (555) 334-1122', website: 'https://apexhorizons.com', address: '100 Market St, San Francisco, CA', status: 'ACTIVE', createdAt: new Date().toISOString() },
    { id: 'c2', name: 'BluePeak Analytics', company: 'BluePeak Analytics', email: 'contact@bluepeakanalytics.io', phone: '+1 (555) 445-2233', website: 'https://bluepeakanalytics.io', address: '250 Broadway, New York, NY', status: 'ACTIVE', createdAt: new Date().toISOString() },
    { id: 'c3', name: 'Catalyst Cloud Services', company: 'Catalyst Cloud Services', email: 'info@catalystcloud.net', phone: '+1 (555) 556-3344', website: 'https://catalystcloud.net', address: '500 Technology Square, Cambridge, MA', status: 'ACTIVE', createdAt: new Date().toISOString() },
    { id: 'c4', name: 'Delta Dynamics Corp', company: 'Delta Dynamics Corp', email: 'accounts@deltadynamics.com', phone: '+1 (555) 667-4455', website: 'https://deltadynamics.com', address: '1200 Congress Ave, Austin, TX', status: 'ACTIVE', createdAt: new Date().toISOString() },
    { id: 'c5', name: 'Genesis BioPharma', company: 'Genesis BioPharma', email: 'info@genesisbiopharma.com', phone: '+1 (555) 990-7788', website: 'https://genesisbiopharma.com', address: '400 Research Pkwy, Raleigh, NC', status: 'ACTIVE', createdAt: new Date().toISOString() },
  ],

  deals: [
    { id: 'd1', title: 'Global Cloud Modernization', amount: 95000, stage: 'CLOSED_WON', probability: 100, customerName: 'Apex Horizons Inc', createdAt: new Date().toISOString() },
    { id: 'd2', title: 'Enterprise Analytics Suite', amount: 54000, stage: 'CLOSED_WON', probability: 100, customerName: 'BluePeak Analytics', createdAt: new Date().toISOString() },
    { id: 'd3', title: 'Autonomous Fleet Telematics', amount: 78000, stage: 'NEGOTIATION', probability: 80, customerName: 'Delta Dynamics Corp', createdAt: new Date().toISOString() },
    { id: 'd4', title: 'Multi-Region Infrastructure Scale', amount: 62000, stage: 'PROPOSAL', probability: 60, customerName: 'Catalyst Cloud Services', createdAt: new Date().toISOString() },
    { id: 'd5', title: 'Zero-Trust Identity Deployment', amount: 48000, stage: 'QUALIFICATION', probability: 40, customerName: 'Genesis BioPharma', createdAt: new Date().toISOString() },
    { id: 'd6', title: 'AI Factory Automation Pilot', amount: 110000, stage: 'PROSPECTING', probability: 20, customerName: 'Vanguard Technologies', createdAt: new Date().toISOString() },
  ],

  tasks: [
    { id: 't1', title: 'Finalize enterprise contract terms with Marcus Sterling', priority: 'HIGH', status: 'TODO', dueDate: new Date(Date.now() + 86400000).toISOString() },
    { id: 't2', title: 'Send security compliance report to CloudScale legal team', priority: 'URGENT', status: 'IN_PROGRESS', dueDate: new Date(Date.now() + 172800000).toISOString() },
    { id: 't3', title: 'Conduct quarterly business review with Apex Horizons', priority: 'MEDIUM', status: 'TODO', dueDate: new Date(Date.now() + 259200000).toISOString() },
    { id: 't4', title: 'Prepare custom SOC2 compliance documentation', priority: 'HIGH', status: 'COMPLETED', dueDate: new Date(Date.now() + 345600000).toISOString() },
    { id: 't5', title: 'Demo automated lead routing workflow to sales leadership', priority: 'MEDIUM', status: 'TODO', dueDate: new Date(Date.now() + 432000000).toISOString() },
  ],

  activities: [
    { id: 'act_1', type: 'CALL', title: 'Discovery Call with Vanguard', description: 'Discussed cloud migration scope and timeline with VP of Engineering.', createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
    { id: 'act_2', type: 'EMAIL', title: 'Sent Pricing Proposal to CloudScale', description: 'Shared Tier 2 enterprise proposal with annual discount terms.', createdAt: new Date(Date.now() - 5 * 3600000).toISOString() },
    { id: 'act_3', type: 'MEETING', title: 'Executive Alignment Meeting', description: 'Met with CPO and Head of Ops to demonstrate pipeline automation.', createdAt: new Date(Date.now() - 9 * 3600000).toISOString() },
    { id: 'act_4', type: 'STATUS_CHANGE', title: 'Deal Moved to Negotiation', description: 'Commercial terms agreed in principle, proceeding to legal redlines.', createdAt: new Date(Date.now() - 15 * 3600000).toISOString() },
    { id: 'act_5', type: 'DEAL_WON', title: 'Deal Closed Won! 🎉', description: 'Signed contract received. Deal value $95,000 booked.', createdAt: new Date(Date.now() - 24 * 3600000).toISOString() },
  ],

  team: {
    members: [
      { id: 'm1', role: 'OWNER', user: { id: 'usr_demo_user', email: 'demo@clientflow.io', firstName: 'Demo', lastName: 'User', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }, joinedAt: new Date(Date.now() - 90 * 86400000).toISOString() },
      { id: 'm2', role: 'ADMIN', user: { id: 'usr_2', email: 'alex.rivera@clientflow.io', firstName: 'Alex', lastName: 'Rivera', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' }, joinedAt: new Date(Date.now() - 60 * 86400000).toISOString() },
      { id: 'm3', role: 'SALES', user: { id: 'usr_3', email: 'david.kim@clientflow.io', firstName: 'David', lastName: 'Kim', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' }, joinedAt: new Date(Date.now() - 45 * 86400000).toISOString() },
      { id: 'm4', role: 'MEMBER', user: { id: 'usr_4', email: 'elena.rostova@clientflow.io', firstName: 'Elena', lastName: 'Rostova', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' }, joinedAt: new Date(Date.now() - 30 * 86400000).toISOString() },
    ],
    invitations: [],
  },

  billing: {
    plan: 'PRO',
    status: 'ACTIVE',
    price: 49,
    interval: 'month',
    currentPeriodEnd: new Date(Date.now() + 28 * 86400000).toISOString(),
    cancelAtPeriodEnd: false,
    paymentMethod: { brand: 'visa', last4: '4242', expMonth: 12, expYear: 2028 },
    invoices: [
      { id: 'inv_1', number: 'INV-2025-001', amount: 49.0, status: 'PAID', date: new Date(Date.now() - 30 * 86400000).toISOString(), pdfUrl: '#' },
      { id: 'inv_2', number: 'INV-2025-002', amount: 49.0, status: 'PAID', date: new Date(Date.now() - 60 * 86400000).toISOString(), pdfUrl: '#' },
    ],
  },

  notifications: [
    { id: 'n1', title: 'Deal Won! 🎉', message: 'Global Cloud Modernization was moved to Closed Won ($95,000).', read: false, createdAt: new Date(Date.now() - 1800000).toISOString() },
    { id: 'n2', title: 'High-Value Lead Created', message: 'Marcus Sterling from Vanguard Technologies joined the pipeline.', read: false, createdAt: new Date(Date.now() - 5400000).toISOString() },
    { id: 'n3', title: 'Monthly Plan Active', message: 'Your Pro tier workspace subscription renewed successfully.', read: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 'n4', title: 'New Task Assigned', message: 'Send security compliance report to CloudScale legal team.', read: true, createdAt: new Date(Date.now() - 172800000).toISOString() },
  ],
};
