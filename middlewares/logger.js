const logger = require('../utils/logger')

module.exports = async (ctx, next) => {
  const start = Date.now()
  
  try {
    await next()
  } catch (err) {
    // 由错误处理中间件处理
    throw err
  }
  
  const ms = Date.now() - start
  const logMsg = `${ctx.method} ${ctx.url} - ${ms}ms - ${ctx.status}`
  
  if (ctx.status >= 500) {
    logger.error(logMsg)
  } else if (ctx.status >= 400) {
    logger.warn(logMsg)
  } else {
    logger.info(logMsg)
  }
}
