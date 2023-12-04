# Fastify MS Graph Change Notification Webhook Plugin

Fastify plugin implementing [MS Graph Change Notifications webhook](https://learn.microsoft.com/it-it/graph/change-notifications-delivery-webhooks?tabs=http).

## Install

```
npm i --save fastify-msgraph-change-notification-webhook
```

## Usage

The plugin requires at least `fastify:4.x`.

```js
const fastifyChangeNotificationWebhook = require('fastify-msgraph-change-notification-webhook')
const fastify = require('fastify')()

/** ... setup fastify instance ... */

fastify.register(fastifyChangeNotificationWebhook, {
    path: '/your-webhook-path'
    subscriptions: {
        'subscription-1': {
            clientState: 'subscription-1-secret',
            callback: (notification) => console.log('subscription-1 sent notification', notification)
        },
        'subscription-2': {
            clientState: 'subscription-2-secret',
            callback: (notification) => console.log('subscription-2 sent notification', notification)
        }
    },
})
```

## Reference

This plugin exposes a `POST` route under the path provided by the plugin which:

* implements [validation url procedure](https://learn.microsoft.com/it-it/graph/change-notifications-delivery-webhooks?tabs=http#notificationurl-validation);
* for each [change notification](https://learn.microsoft.com/it-it/graph/change-notifications-delivery-webhooks?tabs=http#receive-notifications) received: 
  * verifies that the change notification secret is valid;
  * executes a callback.

  Secrets and callbacks are provided to the plugin by the `subscriptions` object. It's a key-value pair JSON where each entry has its own MS Graph `subscriptionId` and contains the following information:
    * `clientState`: the value provided during subscription to validate change notifications;
    * `callback`: a function that will process the notification

The route responds with status code 200 if all callbacks during a request are executed correctly, otherwise a status code 500 will be returned: this means that MS Graph will try to re-process the notification later.

Also, the plugin exposes a copy of the `subscriptions` object through your `fastify` instance.
