const Router = require('koa-router')
const controller = require('../controllers/api')

const router = new Router({
  prefix: '' 
})

router.all('/mail_all', controller.mail_all);
router.all('/mail_new', controller.mail_new);
router.all('/process-mailbox', controller.process_mailbox);
router.all('/test-proxy', controller.test_proxy);

module.exports = router
