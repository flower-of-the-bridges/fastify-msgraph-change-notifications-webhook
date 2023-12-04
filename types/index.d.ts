import type { FastifyPluginAsync } from 'fastify';
import { AsyncFunction } from 'fastify/types/instance';

declare module 'fastify' {
  interface FastifyInstance {
    /**
     * MS Graph subscriptions
     */
    subscriptions: Record<string, changeNotificationWebhook.Subscription>;
  }
}

type ChangeNotificationWebhook = FastifyPluginAsync<changeNotificationWebhook.ChangeNotificationWebhookOptions>;

declare namespace changeNotificationWebhook {

  export interface Subscription {
    /**
     * secret that will be used to validate notifications
     */
    clientState: string,
    /**
     * callback that will be executed for each notification received
     */
    callback: AsyncFunction
  }

  export interface ChangeNotificationWebhookOptions {
    /**
     * Path where the webhook will be exposed
     */
    path: string,

    /**
     * MS Graph Subscriptions 
     * @default {{}}
     */
    subscriptions: Record<string, Subscription>;
  }

  export const changeNotificationWebhook: ChangeNotificationWebhook
  export { changeNotificationWebhook as default }
}

declare function changeNotificationWebhook(...params: Parameters<ChangeNotificationWebhook>): ReturnType<ChangeNotificationWebhook>
export = changeNotificationWebhook