const service = require('../services/api')
const logger = require('../utils/logger')

const controller = {
  async mail_all(ctx) {
    try {
      const { refresh_token, client_id, email, mailbox, socks5, http } = ctx.method === "GET" ? ctx.query : ctx.request.body;
      const data = await service.mail_all(refresh_token, client_id, email, mailbox, socks5, http)
      ctx.body = { code: "200", data }
    } catch (err) {
      logger.error('Failed to mail_all', err)
      ctx.throw(500, 'Failed to mail_all')
    }
  },

  async mail_new(ctx) {
    try {
      const { refresh_token, client_id, email, mailbox, socks5, http } = ctx.method === "GET" ? ctx.query : ctx.request.body;
      const data = await service.mail_new(refresh_token, client_id, email, mailbox, socks5, http)
      ctx.body = { code: "200", data }
    } catch (err) {
      logger.error('Failed to mail_new', err)
      ctx.throw(500, 'Failed to mail_new')
    }
  },

  async process_mailbox(ctx) {
    try {
      const { refresh_token, client_id, email, mailbox, socks5, http } = ctx.method === "GET" ? ctx.query : ctx.request.body;
      const data = await service.process_mailbox(refresh_token, client_id, email, mailbox, socks5, http)
      ctx.body = { code: "200", data }
    } catch (err) {
      logger.error('Failed to process_mailbox', err)
      ctx.throw(500, 'Failed to process_mailbox')
    }
  },

  async test_proxy(ctx) {
    try {
      const { socks5, http } = ctx.method === "GET" ? ctx.query : ctx.request.body;
      const data = await service.test_proxy(socks5, http)
      ctx.body = { code: "200", data }
    } catch (err) {
      logger.error('Failed to test_proxy', err)
      ctx.throw(500, 'Failed to test_proxy')
    }
  },
}

module.exports = controller
