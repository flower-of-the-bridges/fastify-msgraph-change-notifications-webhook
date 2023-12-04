const tap = require('tap')
const sinon = require('sinon')
const Fastify = require('fastify')
const fastifyChangeNotificationWebhook = require('..')


tap.test('change notification plugin', async t => {
    
	const CLIENT_STATE = 'my-state'
	const SUBSCRIPTION_ID = 'my-id'  

	const OK_NOTIFICATION = {
		'id': 'lsgTZMr9KwAAA',
		'subscriptionId': SUBSCRIPTION_ID,
		'subscriptionExpirationDateTime':'2016-03-19T22:11:09.952Z',
		'clientState': CLIENT_STATE,
		'changeType':'created',
		'resource':'users/{user_guid}@{tenant_guid}/messages/{long_id_string}',
		'tenantId': '84bd8158-6d4d-4958-8b9f-9d6445542f95',
		'resourceData':
        {
        	'@odata.type':'#Microsoft.Graph.Message',
        	'@odata.id':'Users/{user_guid}@{tenant_guid}/Messages/{long_id_string}',
        	'@odata.etag':'W/"CQAAABYAAADkrWGo7bouTKlsgTZMr9KwAAAUWRHf"',
        	'id':'{long_id_string}'
        }
	}

	const TEST_NOTIFICATION = {
		'value': [
			OK_NOTIFICATION,
			{
				'id': 'lsgTZMr9KwAAA',
				'subscriptionId': 'wrong-subscrption-id',
				'subscriptionExpirationDateTime':'2016-03-19T22:11:09.952Z',
				'clientState': CLIENT_STATE,
				'changeType':'created',
				'resource':'users/{user_guid}@{tenant_guid}/messages/{long_id_string}',
				'tenantId': '84bd8158-6d4d-4958-8b9f-9d6445542f95',
				'resourceData':
            {
            	'@odata.type':'#Microsoft.Graph.Message',
            	'@odata.id':'Users/{user_guid}@{tenant_guid}/Messages/{long_id_string}',
            	'@odata.etag':'W/"CQAAABYAAADkrWGo7bouTKlsgTZMr9KwAAAUWRHf"',
            	'id':'{long_id_string}'
            }
			},
			{
				'id': 'lsgTZMr9KwAAA',
				'subscriptionId': SUBSCRIPTION_ID,
				'subscriptionExpirationDateTime':'2016-03-19T22:11:09.952Z',
				'clientState': 'wrong-client-state',
				'changeType':'created',
				'resource':'users/{user_guid}@{tenant_guid}/messages/{long_id_string}',
				'tenantId': '84bd8158-6d4d-4958-8b9f-9d6445542f95',
				'resourceData':
            {
            	'@odata.type':'#Microsoft.Graph.Message',
            	'@odata.id':'Users/{user_guid}@{tenant_guid}/Messages/{long_id_string}',
            	'@odata.etag':'W/"CQAAABYAAADkrWGo7bouTKlsgTZMr9KwAAAUWRHf"',
            	'id':'{long_id_string}'
            }
			}
		]
	}

	t.test('plugin ok', async t => {
		const fastify = Fastify()
		const BASE_CLIENT_SUBSCRIPTIONS = {}
		const mockCallback = sinon.fake.resolves()
		BASE_CLIENT_SUBSCRIPTIONS[SUBSCRIPTION_ID] = {
			clientState: CLIENT_STATE,
			callback: mockCallback
		} 
        
		await fastify.register(fastifyChangeNotificationWebhook, {
			path: '/',
			subscriptions: BASE_CLIENT_SUBSCRIPTIONS,
		})
		await fastify.ready()
		t.strictSame(fastify.subscriptions, BASE_CLIENT_SUBSCRIPTIONS)

		t.test('webhook returns query validation token', async t => {    
			const validationToken = 'testValidationToken'
			const { statusCode, payload } = await fastify.inject({
				path: '/',
				method: 'POST',
				query: {
					validationToken,
				}
			})
			t.strictSame(statusCode, 200)
			t.strictSame(payload, validationToken)
		})

		t.test('webhook executes only callback from allowed notification', async t => {    
			const { statusCode } = await fastify.inject({
				path: '/',
				method: 'POST',
				body: TEST_NOTIFICATION,
			})
			t.strictSame(statusCode, 200)
			t.ok(mockCallback.calledOnceWith(fastify.log, OK_NOTIFICATION))
		})

		t.teardown(async() => fastify.close())
	})
    

	t.test('plugin ko', async t => {
		const BASE_CLIENT_SUBSCRIPTIONS = {}
		const mockFailCallback = sinon.fake.rejects()
		BASE_CLIENT_SUBSCRIPTIONS[SUBSCRIPTION_ID] = {
			clientState: CLIENT_STATE,
			callback: mockFailCallback
		} 
		t.test('webhook returns 500 if callback fails', async t => {   
			const fastify = Fastify()
            
			await fastify.register(fastifyChangeNotificationWebhook, {
				path: '/',
				subscriptions: BASE_CLIENT_SUBSCRIPTIONS,
			})
			await fastify.ready() 
			const { statusCode } = await fastify.inject({
				path: '/',
				method: 'POST',
				body: TEST_NOTIFICATION,
			})
			await fastify.close()
			t.strictSame(statusCode, 500)
			t.ok(mockFailCallback.calledOnceWith(fastify.log, OK_NOTIFICATION))
		})

		t.test('no path has been provided', async t => {
			const fastify = Fastify()
            
			try {
				await fastify.register(fastifyChangeNotificationWebhook, {
					subscriptions: BASE_CLIENT_SUBSCRIPTIONS,
				})
				t.fail('test should fail')
			}catch(error) {
				t.ok(error)
			} finally {
				await fastify.close()
			}        
		})

		t.test('invalid subscriptions structure', async t => {
			const fastify = Fastify()
            
			try {
				await fastify.register(fastifyChangeNotificationWebhook, {
					path: '/',
					subscriptions: { 
						wrongSubscription: {
						}
					},
				})
				t.fail('test should fail')
			}catch(error) {
				t.ok(error)
			} finally {
				await fastify.close()
			}      
		})
        
	})
})