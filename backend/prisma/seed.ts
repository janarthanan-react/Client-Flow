import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting ClientFlow Database Seeding...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('ClientFlow2025!', 10);

  // 1. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Acme Growth Corp',
      slug: 'acme-growth-corp',
      plan: 'PRO',
      stripeCustomerId: 'cus_demo_acme_growth_123',
      stripeSubscriptionId: 'sub_demo_pro_monthly_456',
    },
  });
  console.log(`Created Organization: ${org.name}`);

  // 2. Create Users
  const userOwner = await prisma.user.create({
    data: {
      email: 'demo@clientflow.io',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Jenkins',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      emailVerified: true,
    },
  });

  const userAdmin = await prisma.user.create({
    data: {
      email: 'admin@clientflow.io',
      passwordHash,
      firstName: 'Alex',
      lastName: 'Rivera',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      emailVerified: true,
    },
  });

  const userSales = await prisma.user.create({
    data: {
      email: 'sales@clientflow.io',
      passwordHash,
      firstName: 'David',
      lastName: 'Kim',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      emailVerified: true,
    },
  });

  const userMember = await prisma.user.create({
    data: {
      email: 'member@clientflow.io',
      passwordHash,
      firstName: 'Elena',
      lastName: 'Rostova',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      emailVerified: true,
    },
  });

  // Assign Organization Memberships
  await prisma.organizationMember.createMany({
    data: [
      { userId: userOwner.id, organizationId: org.id, role: 'OWNER' },
      { userId: userAdmin.id, organizationId: org.id, role: 'ADMIN' },
      { userId: userSales.id, organizationId: org.id, role: 'SALES' },
      { userId: userMember.id, organizationId: org.id, role: 'MEMBER' },
    ],
  });
  console.log('Created 4 Demo Users and Organization Memberships');

  // 3. Create Subscription & Payment records
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  await prisma.subscription.create({
    data: {
      organizationId: org.id,
      stripeSubscriptionId: 'sub_demo_pro_monthly_456',
      plan: 'PRO',
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
      cancelAtPeriodEnd: false,
    },
  });

  await prisma.payment.createMany({
    data: [
      {
        organizationId: org.id,
        stripePaymentIntentId: 'pi_demo_jan_001',
        amount: 29.0,
        currency: 'usd',
        status: 'succeeded',
      },
      {
        organizationId: org.id,
        stripePaymentIntentId: 'pi_demo_feb_002',
        amount: 29.0,
        currency: 'usd',
        status: 'succeeded',
      },
    ],
  });

  // 4. Create 32 Leads
  const leadsData = [
    { firstName: 'Marcus', lastName: 'Sterling', email: 'marcus@vanguardtech.io', company: 'Vanguard Technologies', phone: '+1 (555) 234-5678', title: 'VP of Engineering', status: 'NEW', source: 'WEBSITE', estimatedValue: 12000, assignedToUserId: userSales.id },
    { firstName: 'Jessica', lastName: 'Alvarez', email: 'jalvarez@cloudscale.net', company: 'CloudScale Solutions', phone: '+1 (555) 345-6789', title: 'Head of Operations', status: 'CONTACTED', source: 'LINKEDIN', estimatedValue: 24000, assignedToUserId: userSales.id },
    { firstName: 'Liam', lastName: 'Thorne', email: 'liam@finflow.co', company: 'FinFlow Systems', phone: '+1 (555) 456-7890', title: 'Chief Product Officer', status: 'QUALIFIED', source: 'REFERRAL', estimatedValue: 45000, assignedToUserId: userOwner.id },
    { firstName: 'Sophia', lastName: 'Chen', email: 'sophia.c@nexusai.com', company: 'Nexus AI Labs', phone: '+1 (555) 567-8901', title: 'Director of Growth', status: 'PROPOSAL', source: 'INBOUND', estimatedValue: 35000, assignedToUserId: userSales.id },
    { firstName: 'Ethan', lastName: 'Hunt', email: 'ethan@synergypartners.org', company: 'Synergy Global', phone: '+1 (555) 678-9012', title: 'Managing Director', status: 'UNQUALIFIED', source: 'COLD_OUTREACH', estimatedValue: 8000, assignedToUserId: userMember.id },
    { firstName: 'Amara', lastName: 'Okafor', email: 'amara@stridesoft.com', company: 'Stride Software', phone: '+1 (555) 789-0123', title: 'COO', status: 'NEW', source: 'WEBSITE', estimatedValue: 18500, assignedToUserId: userSales.id },
    { firstName: 'Bradley', lastName: 'Cooper', email: 'bcooper@apexmedia.agency', company: 'Apex Digital Media', phone: '+1 (555) 890-1234', title: 'CEO', status: 'QUALIFIED', source: 'REFERRAL', estimatedValue: 28000, assignedToUserId: userAdmin.id },
    { firstName: 'Chloe', lastName: 'Dubois', email: 'cdubois@lumierebrands.fr', company: 'Lumière Brands', phone: '+33 1 42 68 55 00', title: 'Global Brand Lead', status: 'CONTACTED', source: 'LINKEDIN', estimatedValue: 15000, assignedToUserId: userSales.id },
    { firstName: 'Daniel', lastName: 'Kaufman', email: 'dkaufman@quantumretail.de', company: 'Quantum Retail Group', phone: '+49 30 2345678', title: 'Head of E-commerce', status: 'PROPOSAL', source: 'INBOUND', estimatedValue: 52000, assignedToUserId: userOwner.id },
    { firstName: 'Emma', lastName: 'Watson', email: 'emma@greenleafhealth.org', company: 'GreenLeaf Wellness', phone: '+1 (555) 901-2345', title: 'Director of Partnerships', status: 'NEW', source: 'WEBSITE', estimatedValue: 9500, assignedToUserId: null },
    { firstName: 'Felix', lastName: 'Baumgartner', email: 'felix@stratosphere.aero', company: 'Stratosphere Aerospace', phone: '+1 (555) 012-3456', title: 'Procurement Specialist', status: 'CONTACTED', source: 'COLD_OUTREACH', estimatedValue: 75000, assignedToUserId: userSales.id },
    { firstName: 'Grace', lastName: 'Hopper', email: 'ghopper@compilersec.io', company: 'Compiler Security', phone: '+1 (555) 123-4567', title: 'Chief Architect', status: 'QUALIFIED', source: 'REFERRAL', estimatedValue: 32000, assignedToUserId: userSales.id },
    { firstName: 'Henry', lastName: 'Cavill', email: 'henry@metropolislogistics.com', company: 'Metropolis Freight', phone: '+1 (555) 234-8901', title: 'Fleet Operations Mgr', status: 'NEW', source: 'OTHER', estimatedValue: 14000, assignedToUserId: null },
    { firstName: 'Isabella', lastName: 'Rossi', email: 'isabella@venicelux.it', company: 'Venice Luxury Escapes', phone: '+39 041 523456', title: 'Marketing Director', status: 'CONTACTED', source: 'LINKEDIN', estimatedValue: 22000, assignedToUserId: userMember.id },
    { firstName: 'Jack', lastName: 'Morrison', email: 'jack@overwatchsec.com', company: 'Overwatch Defense', phone: '+1 (555) 345-0987', title: 'Security Lead', status: 'PROPOSAL', source: 'INBOUND', estimatedValue: 60000, assignedToUserId: userOwner.id },
    { firstName: 'Kavita', lastName: 'Patel', email: 'kpatel@indicabiotech.in', company: 'Indica Biotech', phone: '+91 22 24567890', title: 'VP Clinical Research', status: 'QUALIFIED', source: 'WEBSITE', estimatedValue: 41000, assignedToUserId: userSales.id },
    { firstName: 'Lucas', lastName: 'Vance', email: 'lucas@hyperloopventures.io', company: 'Hyperloop Ventures', phone: '+1 (555) 456-1122', title: 'Managing Partner', status: 'NEW', source: 'REFERRAL', estimatedValue: 50000, assignedToUserId: userAdmin.id },
    { firstName: 'Mia', lastName: 'Hammond', email: 'mhammond@crestviewrealestate.com', company: 'Crestview Capital', phone: '+1 (555) 567-2233', title: 'Principal Broker', status: 'CONTACTED', source: 'COLD_OUTREACH', estimatedValue: 19000, assignedToUserId: userSales.id },
    { firstName: 'Noah', lastName: 'Centineo', email: 'noah@streamcraft.tv', company: 'StreamCraft Media', phone: '+1 (555) 678-3344', title: 'Content Operations', status: 'QUALIFIED', source: 'LINKEDIN', estimatedValue: 27500, assignedToUserId: userSales.id },
    { firstName: 'Olivia', lastName: 'Wilde', email: 'olivia@beaconlegal.law', company: 'Beacon Legal Partners', phone: '+1 (555) 789-4455', title: 'Managing Attorney', status: 'PROPOSAL', source: 'INBOUND', estimatedValue: 38000, assignedToUserId: userOwner.id },
    { firstName: 'Parker', lastName: 'Posey', email: 'parker@urbanmodern.design', company: 'UrbanModern Architecture', phone: '+1 (555) 890-5566', title: 'Lead Architect', status: 'NEW', source: 'WEBSITE', estimatedValue: 16000, assignedToUserId: null },
    { firstName: 'Quinn', lastName: 'Fabray', email: 'quinn@solarpulse.energy', company: 'SolarPulse Renewables', phone: '+1 (555) 901-6677', title: 'Director of Business Dev', status: 'CONTACTED', source: 'REFERRAL', estimatedValue: 48000, assignedToUserId: userSales.id },
    { firstName: 'Rafael', lastName: 'Nadal', email: 'rafa@mallorcasports.es', company: 'Mallorca Sports Center', phone: '+34 971 845678', title: 'General Manager', status: 'QUALIFIED', source: 'OTHER', estimatedValue: 31000, assignedToUserId: userMember.id },
    { firstName: 'Sienna', lastName: 'Miller', email: 'sienna@veritasconsulting.co', company: 'Veritas Strategy Group', phone: '+1 (555) 012-7788', title: 'Senior Partner', status: 'PROPOSAL', source: 'LINKEDIN', estimatedValue: 64000, assignedToUserId: userOwner.id },
    { firstName: 'Tristan', lastName: 'Wilds', email: 'tristan@kineticrobotics.tech', company: 'Kinetic Robotics', phone: '+1 (555) 123-8899', title: 'VP Product Engineering', status: 'NEW', source: 'WEBSITE', estimatedValue: 85000, assignedToUserId: userSales.id },
    { firstName: 'Uma', lastName: 'Thurman', email: 'uma@killbillsolutions.com', company: 'KillBill Fintech', phone: '+1 (555) 234-9900', title: 'Chief Executive Officer', status: 'QUALIFIED', source: 'REFERRAL', estimatedValue: 92000, assignedToUserId: userAdmin.id },
    { firstName: 'Victor', lastName: 'Stone', email: 'victor@cyberneticdefense.mil', company: 'Cybernetics Research', phone: '+1 (555) 345-1011', title: 'Security Consultant', status: 'CONTACTED', source: 'COLD_OUTREACH', estimatedValue: 21000, assignedToUserId: userSales.id },
    { firstName: 'Willa', lastName: 'Holland', email: 'willa@arrowlogistics.com', company: 'Arrow Global Supply', phone: '+1 (555) 456-2122', title: 'Supply Chain Director', status: 'PROPOSAL', source: 'INBOUND', estimatedValue: 43000, assignedToUserId: userSales.id },
    { firstName: 'Xavier', lastName: 'Woods', email: 'xavier@bootyocereal.com', company: 'UpUpDown CPG Inc.', phone: '+1 (555) 567-3233', title: 'Head of Merchandising', status: 'UNQUALIFIED', source: 'OTHER', estimatedValue: 5000, assignedToUserId: null },
    { firstName: 'Yara', lastName: 'Shahidi', email: 'yara@nextgentalent.org', company: 'NextGen Talent Agency', phone: '+1 (555) 678-4344', title: 'Founding Partner', status: 'QUALIFIED', source: 'LINKEDIN', estimatedValue: 33000, assignedToUserId: userSales.id },
    { firstName: 'Zane', lastName: 'Truesdale', email: 'zane@cyberdragonelectronics.jp', company: 'Cyber Dragon Hardware', phone: '+81 3 5555 0192', title: 'VP Procurement', status: 'NEW', source: 'WEBSITE', estimatedValue: 58000, assignedToUserId: userSales.id },
    { firstName: 'Aria', lastName: 'Montgomery', email: 'aria@rosewoodpublishing.com', company: 'Rosewood Literary', phone: '+1 (555) 789-5455', title: 'Senior Editor', status: 'CONTACTED', source: 'REFERRAL', estimatedValue: 12500, assignedToUserId: userMember.id },
  ];

  for (const item of leadsData) {
    await prisma.lead.create({
      data: {
        ...item,
        organizationId: org.id,
      },
    });
  }
  console.log(`Created ${leadsData.length} Leads`);

  // 5. Create 16 Customers
  const customersData = [
    { name: 'Apex Horizons Inc', company: 'Apex Horizons Inc', email: 'billing@apexhorizons.com', phone: '+1 (555) 334-1122', website: 'https://apexhorizons.com', address: '100 Market St, San Francisco, CA', status: 'ACTIVE' },
    { name: 'BluePeak Analytics', company: 'BluePeak Analytics', email: 'contact@bluepeakanalytics.io', phone: '+1 (555) 445-2233', website: 'https://bluepeakanalytics.io', address: '250 Broadway, New York, NY', status: 'ACTIVE' },
    { name: 'Catalyst Cloud Services', company: 'Catalyst Cloud Services', email: 'info@catalystcloud.net', phone: '+1 (555) 556-3344', website: 'https://catalystcloud.net', address: '500 Technology Square, Cambridge, MA', status: 'ACTIVE' },
    { name: 'Delta Dynamics Corp', company: 'Delta Dynamics Corp', email: 'accounts@deltadynamics.com', phone: '+1 (555) 667-4455', website: 'https://deltadynamics.com', address: '1200 Congress Ave, Austin, TX', status: 'ACTIVE' },
    { name: 'Echelon Healthcare Group', company: 'Echelon Healthcare Group', email: 'procurement@echelonhealth.org', phone: '+1 (555) 778-5566', website: 'https://echelonhealth.org', address: '750 Michigan Ave, Chicago, IL', status: 'ACTIVE' },
    { name: 'Falcon Logistics Worldwide', company: 'Falcon Logistics Worldwide', email: 'ops@falconworldwide.com', phone: '+1 (555) 889-6677', website: 'https://falconworldwide.com', address: '300 Harbor Blvd, Long Beach, CA', status: 'ACTIVE' },
    { name: 'Genesis BioPharma', company: 'Genesis BioPharma', email: 'info@genesisbiopharma.com', phone: '+1 (555) 990-7788', website: 'https://genesisbiopharma.com', address: '400 Research Pkwy, Raleigh, NC', status: 'ACTIVE' },
    { name: 'Horizon Renewable Power', company: 'Horizon Renewable Power', email: 'contact@horizonrenewable.com', phone: '+1 (555) 112-8899', website: 'https://horizonrenewable.com', address: '1600 17th St, Denver, CO', status: 'ACTIVE' },
    { name: 'Ironclad Systems', company: 'Ironclad Systems', email: 'sales@ironcladsys.io', phone: '+1 (555) 223-9900', website: 'https://ironcladsys.io', address: '800 Westlake Ave N, Seattle, WA', status: 'ACTIVE' },
    { name: 'Jupiter Creative Media', company: 'Jupiter Creative Media', email: 'hello@jupitermedia.la', phone: '+1 (555) 334-0011', website: 'https://jupitermedia.la', address: '6404 Wilshire Blvd, Los Angeles, CA', status: 'ACTIVE' },
    { name: 'Kodiak Retail Network', company: 'Kodiak Retail Network', email: 'support@kodiakretail.com', phone: '+1 (555) 445-1122', website: 'https://kodiakretail.com', address: '900 Nicollet Mall, Minneapolis, MN', status: 'ACTIVE' },
    { name: 'Legacy Asset Management', company: 'Legacy Asset Management', email: 'invest@legacyassets.com', phone: '+1 (555) 556-2233', website: 'https://legacyassets.com', address: '100 Federal St, Boston, MA', status: 'INACTIVE' },
    { name: 'Monolith AI Robotics', company: 'Monolith AI Robotics', email: 'team@monolithrobotics.tech', phone: '+1 (555) 667-3344', website: 'https://monolithrobotics.tech', address: '450 Concar Dr, San Mateo, CA', status: 'ACTIVE' },
    { name: 'Nova Fintech Labs', company: 'Nova Fintech Labs', email: 'founders@novafintech.io', phone: '+1 (555) 778-4455', website: 'https://novafintech.io', address: '200 S Biscayne Blvd, Miami, FL', status: 'ACTIVE' },
    { name: 'Omni Retail Brands', company: 'Omni Retail Brands', email: 'hello@omnibrands.com', phone: '+1 (555) 889-5566', website: 'https://omnibrands.com', address: '1000 5th Ave, New York, NY', status: 'CHURNED' },
    { name: 'Prism Cybersecurity', company: 'Prism Cybersecurity', email: 'security@prismsec.io', phone: '+1 (555) 990-6677', website: 'https://prismsec.io', address: '1800 Tysons Blvd, McLean, VA', status: 'ACTIVE' },
  ];

  const createdCustomers = [];
  for (const c of customersData) {
    const cust = await prisma.customer.create({
      data: {
        ...c,
        organizationId: org.id,
      },
    });
    createdCustomers.push(cust);
  }
  console.log(`Created ${createdCustomers.length} Customers`);

  // 6. Create 18 Deals across Kanban Stages
  const dealsData = [
    { title: 'Enterprise Cloud Migration', amount: 48000, stage: 'CLOSED_WON', probability: 100, customerIndex: 0, assignedToUserId: userSales.id },
    { title: 'Annual Analytics Platform License', amount: 36000, stage: 'CLOSED_WON', probability: 100, customerIndex: 1, assignedToUserId: userOwner.id },
    { title: 'Global Infrastructure Expansion', amount: 95000, stage: 'CLOSED_WON', probability: 100, customerIndex: 2, assignedToUserId: userSales.id },
    { title: 'Security Architecture Audit', amount: 25000, stage: 'CLOSED_WON', probability: 100, customerIndex: 15, assignedToUserId: userAdmin.id },
    { title: 'Autonomous Fleet Telematics', amount: 72000, stage: 'NEGOTIATION', probability: 80, customerIndex: 5, assignedToUserId: userSales.id },
    { title: 'Multi-Region Data Integration', amount: 55000, stage: 'NEGOTIATION', probability: 80, customerIndex: 3, assignedToUserId: userSales.id },
    { title: 'Healthcare Compliance Suite', amount: 62000, stage: 'PROPOSAL', probability: 60, customerIndex: 4, assignedToUserId: userOwner.id },
    { title: 'Clean Energy Monitoring SaaS', amount: 44000, stage: 'PROPOSAL', probability: 60, customerIndex: 7, assignedToUserId: userSales.id },
    { title: 'Omnichannel POS Rollout', amount: 38000, stage: 'PROPOSAL', probability: 60, customerIndex: 10, assignedToUserId: userMember.id },
    { title: 'Clinical Trial Tracking Portal', amount: 84000, stage: 'QUALIFICATION', probability: 40, customerIndex: 6, assignedToUserId: userSales.id },
    { title: 'Zero-Trust Identity Implementation', amount: 40000, stage: 'QUALIFICATION', probability: 40, customerIndex: 8, assignedToUserId: userSales.id },
    { title: 'Digital Content Asset Management', amount: 28000, stage: 'QUALIFICATION', probability: 40, customerIndex: 9, assignedToUserId: userMember.id },
    { title: 'AI Factory Automation Pilot', amount: 110000, stage: 'PROSPECTING', probability: 20, customerIndex: 12, assignedToUserId: userSales.id },
    { title: 'Cross-Border Payments Gateway', amount: 65000, stage: 'PROSPECTING', probability: 20, customerIndex: 13, assignedToUserId: userAdmin.id },
    { title: 'Commercial Real Estate CRM Addon', amount: 19000, stage: 'PROSPECTING', probability: 20, customerIndex: 11, assignedToUserId: userMember.id },
    { title: 'Legacy Inventory Modernization', amount: 32000, stage: 'CLOSED_LOST', probability: 0, customerIndex: 14, assignedToUserId: userSales.id },
    { title: 'Custom ERP Connector Pack', amount: 15000, stage: 'CLOSED_LOST', probability: 0, customerIndex: 3, assignedToUserId: userSales.id },
    { title: 'Executive Dashboard Customization', amount: 22000, stage: 'CLOSED_WON', probability: 100, customerIndex: 0, assignedToUserId: userOwner.id },
  ];

  const createdDeals = [];
  for (const d of dealsData) {
    const customer = createdCustomers[d.customerIndex];
    const deal = await prisma.deal.create({
      data: {
        organizationId: org.id,
        customerId: customer.id,
        title: d.title,
        amount: d.amount,
        stage: d.stage,
        probability: d.probability,
        expectedCloseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        assignedToUserId: d.assignedToUserId,
      },
    });
    createdDeals.push(deal);
  }
  console.log(`Created ${createdDeals.length} Deals across Kanban stages`);

  // 7. Create 20 Tasks
  const tasksData = [
    { title: 'Schedule technical discovery call with Marcus', priority: 'HIGH', status: 'TODO', assignedToUserId: userSales.id },
    { title: 'Send revised master service agreement to CloudScale', priority: 'URGENT', status: 'IN_PROGRESS', assignedToUserId: userOwner.id },
    { title: 'Conduct quarterly business review with Apex Horizons', priority: 'MEDIUM', status: 'TODO', assignedToUserId: userSales.id },
    { title: 'Prepare custom SOC2 compliance documentation', priority: 'HIGH', status: 'COMPLETED', assignedToUserId: userAdmin.id },
    { title: 'Follow up on proposal feedback with Genesis BioPharma', priority: 'MEDIUM', status: 'TODO', assignedToUserId: userSales.id },
    { title: 'Configure dedicated sandbox instance for Monolith AI', priority: 'HIGH', status: 'IN_PROGRESS', assignedToUserId: userAdmin.id },
    { title: 'Review pricing tiers for Echelon Healthcare renewal', priority: 'URGENT', status: 'TODO', assignedToUserId: userOwner.id },
    { title: 'Send product roadmap teaser to Jessica Alvarez', priority: 'LOW', status: 'COMPLETED', assignedToUserId: userSales.id },
    { title: 'Update sales collateral for Q3 Enterprise package', priority: 'MEDIUM', status: 'COMPLETED', assignedToUserId: userMember.id },
    { title: 'Coordinate contract signing with Falcon Logistics', priority: 'URGENT', status: 'IN_PROGRESS', assignedToUserId: userSales.id },
    { title: 'Demo automated lead routing workflow to leadership', priority: 'MEDIUM', status: 'TODO', assignedToUserId: userOwner.id },
    { title: 'Audit inactive contacts in Northeast sales territory', priority: 'LOW', status: 'COMPLETED', assignedToUserId: userMember.id },
    { title: 'Schedule onboarding kickoff with Nova Fintech Labs', priority: 'HIGH', status: 'TODO', assignedToUserId: userSales.id },
    { title: 'Send customer delight gift box to Apex Horizons', priority: 'LOW', status: 'COMPLETED', assignedToUserId: userSales.id },
    { title: 'Draft case study with BluePeak Analytics team', priority: 'MEDIUM', status: 'IN_PROGRESS', assignedToUserId: userMember.id },
    { title: 'Verify Stripe webhook idempotency in staging test', priority: 'HIGH', status: 'COMPLETED', assignedToUserId: userAdmin.id },
    { title: 'Prepare board deck metrics for lead conversion funnel', priority: 'HIGH', status: 'TODO', assignedToUserId: userOwner.id },
    { title: 'Follow up on cold outreach responses from tech CTOs', priority: 'MEDIUM', status: 'IN_PROGRESS', assignedToUserId: userMember.id },
    { title: 'Finalize invoice #1042 for Catalyst Cloud Services', priority: 'URGENT', status: 'COMPLETED', assignedToUserId: userAdmin.id },
    { title: 'Conduct weekly pipeline review and forecasting', priority: 'MEDIUM', status: 'TODO', assignedToUserId: userSales.id },
  ];

  for (let i = 0; i < tasksData.length; i++) {
    const t = tasksData[i];
    await prisma.task.create({
      data: {
        ...t,
        organizationId: org.id,
        customerId: createdCustomers[i % createdCustomers.length].id,
        dueDate: new Date(Date.now() + (i - 5) * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log(`Created ${tasksData.length} Tasks`);

  // 8. Create 30 Activities
  const activitiesData = [
    { type: 'CALL', title: 'Discovery Call', description: 'Discussed cloud migration scope and timeline with VP of Engineering.' },
    { type: 'EMAIL', title: 'Sent Pricing Proposal', description: 'Shared Tier 2 enterprise proposal with annual discount terms.' },
    { type: 'MEETING', title: 'Executive Alignment Meeting', description: 'Met with CPO and Head of Ops to demonstrate pipeline automation.' },
    { type: 'NOTE', title: 'Internal Strategy Note', description: 'Client highly values multi-tenant data isolation and SLA response guarantees.' },
    { type: 'STATUS_CHANGE', title: 'Deal Moved to Negotiation', description: 'Commercial terms agreed in principle, proceeding to legal redlines.' },
    { type: 'CALL', title: 'Follow-up Call', description: 'Addressed questions regarding HIPAA and GDPR compliance features.' },
    { type: 'EMAIL', title: 'Sent Onboarding Packet', description: 'Delivered welcome kit, API credentials, and quick start documentation.' },
    { type: 'MEETING', title: 'Architecture Review', description: 'Whiteboarding session covering REST APIs and real-time webhook events.' },
    { type: 'NOTE', title: 'Quarterly Target Update', description: 'Territory Q2 target exceeded by 18% with closed-won deals.' },
    { type: 'STATUS_CHANGE', title: 'Deal Closed Won', description: 'Signed contract received. Deal value $48,000 booked.' },
    { type: 'CALL', title: 'Check-in Call', description: 'Confirmed customer success check-in for next Thursday at 2 PM.' },
    { type: 'EMAIL', title: 'Product Updates Newsletter', description: 'Sent release notes for new Kanban deals pipeline and task calendar.' },
    { type: 'NOTE', title: 'Procurement Feedback', description: 'Requested net-30 payment terms on future expansion invoices.' },
    { type: 'MEETING', title: 'Security Review Panel', description: 'Completed vendor assessment questionnaire with InfoSec department.' },
    { type: 'CALL', title: 'Inbound Inquiry Call', description: 'Prospect called regarding high-volume lead ingestion from web forms.' },
  ];

  for (let i = 0; i < 30; i++) {
    const template = activitiesData[i % activitiesData.length];
    await prisma.activity.create({
      data: {
        organizationId: org.id,
        performedByUserId: i % 2 === 0 ? userSales.id : userOwner.id,
        customerId: createdCustomers[i % createdCustomers.length].id,
        dealId: createdDeals[i % createdDeals.length].id,
        type: template.type,
        title: template.title,
        description: template.description,
        createdAt: new Date(Date.now() - (30 - i) * 12 * 60 * 60 * 1000),
      },
    });
  }
  console.log('Created 30 Timeline Activities');

  // 9. Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        organizationId: org.id,
        userId: userOwner.id,
        type: 'DEAL_WON',
        title: 'Deal Won! 🎉',
        message: 'Enterprise Cloud Migration was moved to Closed Won ($48,000).',
        link: '/pipeline',
        read: false,
      },
      {
        organizationId: org.id,
        userId: userOwner.id,
        type: 'SUBSCRIPTION_UPDATE',
        title: 'Monthly Plan Active',
        message: 'Your Pro tier subscription renewed successfully.',
        link: '/billing',
        read: true,
      },
      {
        organizationId: org.id,
        userId: userOwner.id,
        type: 'LEAD_ASSIGNED',
        title: 'High-Value Lead Created',
        message: 'Marcus Sterling from Vanguard Technologies joined the pipeline.',
        link: '/leads',
        read: false,
      },
      {
        organizationId: org.id,
        userId: userSales.id,
        type: 'TASK_ASSIGNED',
        title: 'New Task: Discovery Call',
        message: 'Schedule discovery call with Marcus Sterling.',
        link: '/tasks',
        read: false,
      },
    ],
  });
  console.log('Created Demo Notifications');

  // 10. Create Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        organizationId: org.id,
        userId: userOwner.id,
        action: 'REGISTER_ORGANIZATION',
        entity: 'ORGANIZATION',
        entityId: org.id,
        details: JSON.stringify({ orgName: 'Acme Growth Corp' }),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      {
        organizationId: org.id,
        userId: userOwner.id,
        action: 'INVITE_MEMBER',
        entity: 'ORGANIZATION_MEMBER',
        details: JSON.stringify({ email: 'sales@clientflow.io', role: 'SALES' }),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      {
        organizationId: org.id,
        userId: userSales.id,
        action: 'CREATE_LEAD',
        entity: 'LEAD',
        details: JSON.stringify({ lead: 'Marcus Sterling', company: 'Vanguard Technologies' }),
        ipAddress: '192.168.1.25',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
      {
        organizationId: org.id,
        userId: userSales.id,
        action: 'UPDATE_DEAL_STAGE',
        entity: 'DEAL',
        details: JSON.stringify({ deal: 'Enterprise Cloud Migration', fromStage: 'NEGOTIATION', toStage: 'CLOSED_WON' }),
        ipAddress: '192.168.1.25',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
    ],
  });
  console.log('Created Demo Audit Logs');

  console.log('✅ ClientFlow Database Seeding completed successfully!');
  console.log('====================================================');
  console.log('Demo Credentials:');
  console.log('📧 Email: demo@clientflow.io');
  console.log('🔑 Password: ClientFlow2025!');
  console.log('🏢 Organization: Acme Growth Corp (Role: OWNER)');
  console.log('====================================================');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
