const logger = require('../utils/logger')

module.exports = async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    ctx.status = err.status || 500
    ctx.body = {
      code: ctx.status,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
    
    logger.error(`${err.status || 500} - ${err.message} - ${ctx.originalUrl} - ${ctx.method} - ${ctx.ip}`)
    logger.error(err.stack)
  }
}
