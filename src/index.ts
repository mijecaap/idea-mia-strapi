import type { Core } from '@strapi/strapi';

// CMS AI Webhook configuration
const CMS_AI_WEBHOOK_URL = process.env.CMS_AI_WEBHOOK_URL || 'http://localhost:3000/api/webhooks/strapi';
const CMS_AI_WEBHOOK_SECRET = process.env.CMS_AI_WEBHOOK_SECRET || 'cms-ai-webhook-secret';

// Content types to send webhooks for
const WEBHOOK_CONTENT_TYPES = [
  'api::product.product',
  'api::category.category',
  'api::article.article',
  'api::order.order',
  'api::author.author',
  'api::blog-category.blog-category',
  'api::tag.tag',
  'api::homepage.homepage',
  'api::product-image.product-image',
  'api::product-variant.product-variant',
  'api::customization-schema.customization-schema',
];

// Helper to send webhook notification
async function sendWebhook(event: string, model: string, entry: unknown) {
  try {
    const response = await fetch(CMS_AI_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CMS_AI_WEBHOOK_SECRET}`,
      },
      body: JSON.stringify({
        event,
        model,
        entry,
        createdAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.warn(`CMS AI Webhook failed: ${response.status}`);
    }
  } catch (error) {
    console.warn('CMS AI Webhook error:', error);
    // Don't throw - webhook failure shouldn't break Strapi operations
  }
}

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Register lifecycle hooks for CMS AI webhooks
    WEBHOOK_CONTENT_TYPES.forEach((uid) => {
      const modelName = uid.split('.').pop() || uid;

      strapi.db.lifecycles.subscribe({
        models: [uid],

        async afterCreate(event) {
          await sendWebhook('entry.create', modelName, event.result);
        },

        async afterUpdate(event) {
          await sendWebhook('entry.update', modelName, event.result);
        },

        async afterDelete(event) {
          await sendWebhook('entry.delete', modelName, event.result);
        },
      });
    });

    console.log('✅ CMS AI Webhook hooks registered for:', WEBHOOK_CONTENT_TYPES.length, 'content types');
  },
};
