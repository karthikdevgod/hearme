import { Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import type { ServerEnv } from '@hearme/config';
import { ENV } from '../../common/config/config.module';

/** Thin Stripe wrapper. Webhook signature verification lives here so controllers stay clean. */
@Injectable()
export class StripeService {
  readonly client: Stripe;

  constructor(@Inject(ENV) private readonly env: ServerEnv) {
    this.client = new Stripe(this.env.STRIPE_SECRET_KEY || 'sk_test_noop', {
      apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
    });
  }

  /** Verify and construct a webhook event from the raw body + signature header. */
  constructEvent(rawBody: Buffer, signature: string): Stripe.Event {
    return this.client.webhooks.constructEvent(rawBody, signature, this.env.STRIPE_WEBHOOK_SECRET);
  }
}
