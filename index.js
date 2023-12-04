const fastifyPlugin = require('fastify-plugin')

function getAllowedNotificationsFromSubscriptions(subscriptions, notifications) {
	return notifications.filter((notification) => {
		const { subscriptionId, clientState } = notification
		const clientSecret = subscriptions[subscriptionId]?.clientState
		return clientSecret && clientSecret === clientState
	})
}

function checkOptions(options) {
	const { path, subscriptions } = options
	
	if(!path && typeof path !== 'string') {
		return new Error('no path has been provided')
	}

	let error = null
	for(const subscriptionId of Object.keys(subscriptions)) {
		const { clientState, callback } = subscriptions[subscriptionId]
		if(!clientState || !callback) {
			error = new Error('subscription '+subscriptionId+' has no valid structure.')
		}
	}
	return error
}
/**
 * 
 * @param {import('fastify').FastifyInstance} fastify 
 * @param {import('./types').changeNotificationWebhookOptions} options 
 */
async function changeNotificationWebhook(fastify, options, next) {
	const error = checkOptions(options)
    
	if(error) {
		next(error)
	}
    
	const {
		subscriptions,
		path,
	} = options
    
	fastify.decorate('subscriptions', { ...subscriptions })
	fastify.post(path, async function(request, reply) {
		const { query, body, log } = request
		const response = {
			status: 200
		}
		if(query.validationToken) {
			return reply.type('text/plain').send(query.validationToken)
		}
		const { value: notifications } = body
		log.debug({ body }, 'received notification')
		const allowedNotifications = getAllowedNotificationsFromSubscriptions(subscriptions, notifications)
		try {
			for await( const notification of allowedNotifications) {
				const { callback } = subscriptions[notification.subscriptionId]
				await callback(log.child({ subscriptionId: notification.subscriptionId }), notification)
			}
		} catch(error) {
			log.error(error, 'error occured during change notification')
			response.status = 500
		} finally {
			reply.status(response.status).send()
		} 
	})

	next()
}

module.exports = fastifyPlugin(changeNotificationWebhook, {
	fastify: '4.x',
	name: 'fastify-msgraph-change-notification-webhook'
})