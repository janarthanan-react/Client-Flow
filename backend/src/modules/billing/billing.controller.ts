import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { prisma } from '../../lib/prisma';
import { config } from '../../config';
import { sendSuccess } from '../../utils/apiResponse';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { logger } from '../../lib/logger';
import { emitToOrg } from '../../lib/socket';
import { enqueueEmail } from '../../queues/email.queue';
import { emailTemplates } from '../../lib/email';
import { createAuditLog } from '../../middlewares/audit.middleware';

import fs from 'fs';
import path from 'path';

// Initialize Stripe client
export let stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2025-02-24.acacia' as any,
});

export const reinitializeStripe = (newSecretKey: string) => {
  config.stripe.secretKey = newSecretKey;
  stripe = new Stripe(newSecretKey, {
    apiVersion: '2025-02-24.acacia' as any,
  });
};

export const getBillingDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.orgId!;

    const [org, leadsCount, membersCount, payments, subscription] = await Promise.all([
      prisma.organization.findUnique({ where: { id: orgId } }),
      prisma.lead.count({ where: { organizationId: orgId } }),
      prisma.organizationMember.count({ where: { organizationId: orgId } }),
      prisma.payment.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.subscription.findFirst({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (!org) {
      throw new NotFoundError('Organization not found');
    }

    // Plan limits definition
    const planLimits: Record<string, { maxLeads: number; maxMembers: number }> = {
      FREE: { maxLeads: 50, maxMembers: 3 },
      PRO: { maxLeads: 500, maxMembers: 10 },
      BUSINESS: { maxLeads: 10000, maxMembers: 100 },
    };

    const currentPlan = org.plan || 'FREE';
    const limits = planLimits[currentPlan] || planLimits.FREE;

    return sendSuccess({
      res,
      data: {
        plan: currentPlan,
        status: subscription?.status || 'ACTIVE',
        stripeCustomerId: org.stripeCustomerId,
        currentPeriodEnd: subscription?.currentPeriodEnd || null,
        cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false,
        usage: {
          leads: {
            used: leadsCount,
            limit: limits.maxLeads,
            percentage: Math.min(100, Math.round((leadsCount / limits.maxLeads) * 100)),
          },
          members: {
            used: membersCount,
            limit: limits.maxMembers,
            percentage: Math.min(100, Math.round((membersCount / limits.maxMembers) * 100)),
          },
        },
        payments,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createCheckoutSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.orgId!;
    const { plan } = req.body; // 'PRO' or 'BUSINESS'

    if (!['PRO', 'BUSINESS'].includes(plan)) {
      throw new BadRequestError('Invalid plan selected. Choose PRO or BUSINESS.');
    }

    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) {
      throw new NotFoundError('Organization not found');
    }

    let customerId = org.stripeCustomerId;

    // In local dev without live stripe keys, provide a realistic mock checkout URL
    if (config.stripe.secretKey.includes('mock')) {
      // Simulate successful upgrade directly for local dev testing
      await prisma.organization.update({
        where: { id: orgId },
        data: { plan },
      });

      const now = new Date();
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const existingSub = await prisma.subscription.findFirst({
        where: { organizationId: orgId },
      });

      if (existingSub) {
        await prisma.subscription.update({
          where: { id: existingSub.id },
          data: {
            plan,
            status: 'ACTIVE',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
          },
        });
      } else {
        await prisma.subscription.create({
          data: {
            organizationId: orgId,
            stripeSubscriptionId: `sub_mock_${Date.now()}`,
            plan,
            status: 'ACTIVE',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
          },
        });
      }

      await prisma.payment.create({
        data: {
          organizationId: orgId,
          stripePaymentIntentId: `pi_mock_${Date.now()}`,
          amount: plan === 'PRO' ? 29.0 : 79.0,
          currency: 'usd',
          status: 'succeeded',
        },
      });

      emitToOrg(orgId, 'subscription.updated', { plan, status: 'ACTIVE' });

      enqueueEmail({
        to: req.user!.email,
        ...emailTemplates.subscriptionConfirmed(org.name, plan),
      });

      return sendSuccess({
        res,
        message: `Upgraded to ${plan} plan successfully`,
        data: {
          checkoutUrl: `${config.frontendUrl}/billing?success=true&plan=${plan}`,
          mocked: true,
        },
      });
    }

    // Real Stripe Checkout Session
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user!.email,
        name: org.name,
        metadata: {
          organizationId: org.id,
        },
      });
      customerId = customer.id;

      await prisma.organization.update({
        where: { id: org.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const configuredPriceId = plan === 'PRO' ? config.stripe.proPriceId : config.stripe.businessPriceId;
    const isCustomPrice =
      configuredPriceId &&
      configuredPriceId.startsWith('price_') &&
      !configuredPriceId.includes('mock');

    // Dynamically support price_data so users do not have to manually create products in Stripe Dashboard
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = isCustomPrice
      ? [{ price: configuredPriceId, quantity: 1 }]
      : [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: plan === 'PRO' ? 'ClientFlow Pro Workspace' : 'ClientFlow Business Scale',
                description:
                  plan === 'PRO'
                    ? 'Up to 500 active leads, 10 team seats, revenue analytics & real-time alerts'
                    : 'Unlimited active leads, 100 team seats, full audit logs & priority API throughput',
              },
              unit_amount: plan === 'PRO' ? 2900 : 7900,
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ];

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: lineItems,
      mode: 'subscription',
      billing_address_collection: 'auto',
      allow_promotion_codes: true,
      success_url: `${config.frontendUrl}/billing?session_id={CHECKOUT_SESSION_ID}&success=true&plan=${plan}`,
      cancel_url: `${config.frontendUrl}/billing?canceled=true`,
      metadata: {
        organizationId: org.id,
        plan,
        userId: req.user!.id,
      },
      subscription_data: {
        metadata: {
          organizationId: org.id,
          plan,
        },
      },
    });

    return sendSuccess({
      res,
      data: {
        checkoutUrl: session.url,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createPortalSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.orgId!;
    const org = await prisma.organization.findUnique({ where: { id: orgId } });

    if (!org || !org.stripeCustomerId) {
      throw new BadRequestError('No active Stripe customer found for this organization');
    }

    if (config.stripe.secretKey.includes('mock')) {
      return sendSuccess({
        res,
        data: {
          portalUrl: `${config.frontendUrl}/billing?portal=mock`,
        },
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${config.frontendUrl}/billing`,
    });

    return sendSuccess({
      res,
      data: {
        portalUrl: session.url,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    if (config.stripe.secretKey.includes('mock')) {
      event = req.body;
    } else {
      event = stripe.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);
    }
  } catch (err: any) {
    logger.error(`Stripe Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  logger.info(`Received Stripe webhook event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const organizationId = session.metadata?.organizationId;
        const plan = (session.metadata?.plan as any) || 'PRO';

        if (organizationId) {
          await prisma.organization.update({
            where: { id: organizationId },
            data: {
              plan,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
            },
          });

          emitToOrg(organizationId, 'subscription.updated', { plan, status: 'ACTIVE' });
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = event.data.object as Stripe.Subscription;
        const org = await prisma.organization.findFirst({
          where: { stripeCustomerId: sub.customer as string },
        });

        if (org) {
          await prisma.subscription.upsert({
            where: { stripeSubscriptionId: sub.id },
            update: {
              status: sub.status.toUpperCase() as any,
              currentPeriodStart: new Date((sub as any).current_period_start * 1000),
              currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            },
            create: {
              organizationId: org.id,
              stripeSubscriptionId: sub.id,
              plan: org.plan,
              status: sub.status.toUpperCase() as any,
              currentPeriodStart: new Date((sub as any).current_period_start * 1000),
              currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            },
          });

          emitToOrg(org.id, 'subscription.updated', { status: sub.status.toUpperCase() });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const org = await prisma.organization.findFirst({
          where: { stripeCustomerId: sub.customer as string },
        });

        if (org) {
          await prisma.organization.update({
            where: { id: org.id },
            data: { plan: 'FREE' },
          });

          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: sub.id },
            data: { status: 'CANCELED' },
          });

          emitToOrg(org.id, 'subscription.updated', { plan: 'FREE', status: 'CANCELED' });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const org = await prisma.organization.findFirst({
          where: { stripeCustomerId: invoice.customer as string },
        });

        if (org) {
          await prisma.payment.create({
            data: {
              organizationId: org.id,
              stripePaymentIntentId: (invoice as any).payment_intent as string,
              amount: invoice.amount_paid / 100,
              currency: invoice.currency,
              status: 'succeeded',
              receiptUrl: (invoice as any).hosted_invoice_url,
            },
          });
        }
        break;
      }
    }

    return res.json({ received: true });
  } catch (error: any) {
    logger.error('Error handling Stripe webhook:', { error: error.message });
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};

export const verifySession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.orgId!;
    const { sessionId } = req.body;

    if (!sessionId) {
      throw new BadRequestError('Session ID is required');
    }

    // In mock mode or for mock session IDs
    if (config.stripe.secretKey.includes('mock') || sessionId.startsWith('mock_')) {
      const plan = req.body.plan || 'PRO';
      await prisma.organization.update({
        where: { id: orgId },
        data: { plan },
      });
      emitToOrg(orgId, 'subscription.updated', { plan, status: 'ACTIVE' });
      return sendSuccess({
        res,
        message: `Plan upgraded to ${plan} (demo mode)`,
        data: { verified: true, plan },
      });
    }

    // Retrieve real Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      throw new BadRequestError('Payment has not been completed for this session');
    }

    const plan = (session.metadata?.plan as any) || 'PRO';
    const customerId =
      typeof session.customer === 'string' ? session.customer : session.customer?.id;
    const subId =
      typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

    // Update organization with plan and Stripe IDs
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        plan,
        stripeCustomerId: customerId || undefined,
        stripeSubscriptionId: subId || undefined,
      },
    });

    const now = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    if (subId) {
      await prisma.subscription.upsert({
        where: { stripeSubscriptionId: subId },
        update: {
          plan,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
        create: {
          organizationId: orgId,
          stripeSubscriptionId: subId,
          plan,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });
    }

    // Record payment if not already recorded
    if (session.payment_intent) {
      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent.id;

      const existingPayment = await prisma.payment.findFirst({
        where: { stripePaymentIntentId: paymentIntentId },
      });

      if (!existingPayment) {
        await prisma.payment.create({
          data: {
            organizationId: orgId,
            stripePaymentIntentId: paymentIntentId,
            amount: (session.amount_total || (plan === 'PRO' ? 2900 : 7900)) / 100,
            currency: session.currency || 'usd',
            status: 'succeeded',
          },
        });
      }
    }

    emitToOrg(orgId, 'subscription.updated', { plan, status: 'ACTIVE' });

    createAuditLog({
      req,
      organizationId: orgId,
      userId: req.user?.id,
      action: 'PAYMENT_COMPLETED',
      entity: 'Billing',
      entityId: subId || orgId,
      details: { plan, sessionId, amount: session.amount_total },
    });

    return sendSuccess({
      res,
      message: `Successfully verified and upgraded workspace to ${plan}`,
      data: {
        verified: true,
        plan,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getStripeConfigStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isLiveKey = config.stripe.secretKey.startsWith('sk_live_');
    const isTestKey =
      config.stripe.secretKey.startsWith('sk_test_') &&
      !config.stripe.secretKey.includes('mock');
    const isConfigured = isLiveKey || isTestKey;

    return sendSuccess({
      res,
      data: {
        isConfigured,
        mode: isLiveKey ? 'live' : isTestKey ? 'test' : 'mock',
        publishableKey: config.stripe.publishableKey || '',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateStripeConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { secretKey, publishableKey, webhookSecret } = req.body;

    if (!secretKey || (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('sk_live_'))) {
      throw new BadRequestError(
        'Invalid Stripe secret key. It must start with sk_test_ or sk_live_.'
      );
    }

    reinitializeStripe(secretKey);

    if (publishableKey) {
      config.stripe.publishableKey = publishableKey;
    }
    if (webhookSecret) {
      config.stripe.webhookSecret = webhookSecret;
    }

    // Persist to backend/.env
    try {
      const envPath = path.resolve(__dirname, '../../../.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        if (envContent.includes('STRIPE_SECRET_KEY=')) {
          envContent = envContent.replace(/STRIPE_SECRET_KEY=.*/, `STRIPE_SECRET_KEY="${secretKey}"`);
        } else {
          envContent += `\nSTRIPE_SECRET_KEY="${secretKey}"\n`;
        }

        if (publishableKey) {
          if (envContent.includes('STRIPE_PUBLISHABLE_KEY=')) {
            envContent = envContent.replace(
              /STRIPE_PUBLISHABLE_KEY=.*/,
              `STRIPE_PUBLISHABLE_KEY="${publishableKey}"`
            );
          } else {
            envContent += `STRIPE_PUBLISHABLE_KEY="${publishableKey}"\n`;
          }
        }

        if (webhookSecret) {
          if (envContent.includes('STRIPE_WEBHOOK_SECRET=')) {
            envContent = envContent.replace(
              /STRIPE_WEBHOOK_SECRET=.*/,
              `STRIPE_WEBHOOK_SECRET="${webhookSecret}"`
            );
          } else {
            envContent += `STRIPE_WEBHOOK_SECRET="${webhookSecret}"\n`;
          }
        }

        fs.writeFileSync(envPath, envContent);
      }
    } catch (fsErr) {
      logger.warn('Could not persist new Stripe keys to backend/.env file', { error: fsErr });
    }

    return sendSuccess({
      res,
      message: 'Stripe credentials configured successfully. Real Stripe Checkout is now active.',
      data: {
        isConfigured: true,
        mode: secretKey.startsWith('sk_live_') ? 'live' : 'test',
        publishableKey: config.stripe.publishableKey,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const processPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.orgId!;
    const { plan, paymentMethod, card } = req.body;

    if (!['PRO', 'BUSINESS'].includes(plan)) {
      throw new BadRequestError('Invalid plan selected. Choose PRO or BUSINESS.');
    }

    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) {
      throw new NotFoundError('Organization not found');
    }

    const amount = plan === 'PRO' ? 29.0 : 79.0;
    const now = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    let stripePaymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // If real Stripe key is configured and user provides card details
    if (!config.stripe.secretKey.includes('mock') && card?.number) {
      try {
        const cleanNumber = card.number.replace(/\s+/g, '');
        const expMonth = parseInt(card.expMonth, 10);
        const expYearStr = card.expYear.length === 2 ? `20${card.expYear}` : card.expYear;
        const expYear = parseInt(expYearStr, 10);

        const paymentMethodObj = await stripe.paymentMethods.create({
          type: 'card',
          card: {
            number: cleanNumber,
            exp_month: expMonth,
            exp_year: expYear,
            cvc: card.cvc,
          },
          billing_details: {
            name: card.name || req.user!.email,
            email: req.user!.email,
          },
        });

        let customerId = org.stripeCustomerId;
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: req.user!.email,
            name: org.name,
            payment_method: paymentMethodObj.id,
            invoice_settings: { default_payment_method: paymentMethodObj.id },
          });
          customerId = customer.id;
          await prisma.organization.update({
            where: { id: org.id },
            data: { stripeCustomerId: customerId },
          });
        } else {
          await stripe.paymentMethods.attach(paymentMethodObj.id, { customer: customerId });
        }

        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: 'usd',
          customer: customerId,
          payment_method: paymentMethodObj.id,
          off_session: true,
          confirm: true,
          description: `ClientFlow ${plan} Workspace Subscription`,
        });

        stripePaymentIntentId = paymentIntent.id;
      } catch (stripeErr: any) {
        logger.error('Stripe card charge error:', stripeErr);
        throw new BadRequestError(stripeErr.message || 'Payment card declined by Stripe');
      }
    }

    // Update organization plan
    await prisma.organization.update({
      where: { id: orgId },
      data: { plan },
    });

    // Upsert subscription
    const existingSub = await prisma.subscription.findFirst({
      where: { organizationId: orgId },
    });

    const subId = existingSub?.stripeSubscriptionId || `sub_${Date.now()}`;

    if (existingSub) {
      await prisma.subscription.update({
        where: { id: existingSub.id },
        data: {
          plan,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          organizationId: orgId,
          stripeSubscriptionId: subId,
          plan,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });
    }

    // Create payment transaction
    const payment = await prisma.payment.create({
      data: {
        organizationId: orgId,
        stripePaymentIntentId,
        amount,
        currency: 'usd',
        status: 'succeeded',
        receiptUrl: `https://pay.clientflow.io/receipts/${stripePaymentIntentId}`,
      },
    });

    emitToOrg(orgId, 'subscription.updated', { plan, status: 'ACTIVE' });

    createAuditLog({
      req,
      organizationId: orgId,
      userId: req.user?.id,
      action: 'PAYMENT_PROCESSED',
      entity: 'Billing',
      entityId: payment.id,
      details: { plan, amount, paymentMethod: paymentMethod || 'card' },
    });

    enqueueEmail({
      to: req.user!.email,
      ...emailTemplates.subscriptionConfirmed(org.name, plan),
    });

    return sendSuccess({
      res,
      message: `Successfully processed payment of $${amount.toFixed(2)} and upgraded workspace to ${plan}!`,
      data: {
        plan,
        payment,
      },
    });
  } catch (error) {
    next(error);
  }
};


