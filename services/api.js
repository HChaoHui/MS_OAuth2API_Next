const logger = require('../utils/logger')
const { use_graph_api, use_get_graph_emails, use_imap_api, generateAuthString, use_get_imap_emails, process_mails, use_test_proxy, use_delete_graph_emails } = require('../services/MailService')

const service = {
  async mail_all(refresh_token, client_id, email, mailbox, socks5, http) {
    try {

      const graph_api_result = await use_graph_api(refresh_token, client_id, mailbox, email, socks5, http)

      if (graph_api_result.status) {
        const graph_emails = await use_get_graph_emails(graph_api_result, undefined, email, socks5, http)
        return graph_emails
      }

      const imap_api_result = await use_imap_api(refresh_token, client_id, email, socks5, http)
      const authString = generateAuthString(email, imap_api_result.access_token)
      const imap_emails = await use_get_imap_emails(email, authString, mailbox, undefined, socks5, http)

      return imap_emails
    } catch (err) {
      logger.error('Service error when mail_all', err)
      throw new Error('Failed to retrieve mail_all')
    }
  },

  async mail_new(refresh_token, client_id, email, mailbox, socks5, http) {
    try {

      const graph_api_result = await use_graph_api(refresh_token, client_id, mailbox, email, socks5, http)

      if (graph_api_result.status) {
        const graph_emails = await use_get_graph_emails(graph_api_result, 1, email, socks5, http)
        return graph_emails
      }

      const imap_api_result = await use_imap_api(refresh_token, client_id, email, socks5, http)
      const authString = generateAuthString(email, imap_api_result.access_token)
      const imap_emails = await use_get_imap_emails(email, authString, mailbox, 1, socks5, http)

      return imap_emails
    } catch (err) {
      logger.error('Service error when mail_new', err)
      throw new Error('Failed to retrieve mail_new')
    }
  },

  async process_mailbox(refresh_token, client_id, email, mailbox, socks5, http) {
    try {

      const graph_api_result = await use_graph_api(refresh_token, client_id, mailbox, email, socks5, http)

      if (graph_api_result.status) {
        const graph_emails = await use_get_graph_emails(graph_api_result, undefined, email, socks5, http)

        for (const email of graph_emails) {
          use_delete_graph_emails(graph_api_result, email.id, socks5, http)
        }

        return { message: '邮件正在清空中... 请稍后查看邮件' }
      }

      const imap_api_result = await use_imap_api(refresh_token, client_id, email, socks5, http)
      const authString = generateAuthString(email, imap_api_result.access_token)
      process_mails(email, authString, mailbox, socks5, http)

      return { message: '邮件正在清空中... 请稍后查看邮件' }
    } catch (err) {
      logger.error('Service error when process_mailbox', err)
      throw new Error('Failed to process_mailbox')
    }
  },

  async test_proxy(socks5, http) {
    try {
      const data = await use_test_proxy(socks5, http)
      return data
    } catch (err) {
      logger.error('Service error when test_proxy', err)
      throw new Error('Failed to test_proxy')
    }
  },
}

module.exports = service
