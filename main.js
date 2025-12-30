const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
const { koaBody } = require('koa-body')
const path = require('path')
const static = require('koa-static')

const app = new Koa()

// 配置
const config = require('./config')

// 记录日志
const logger = require('./utils/logger')
app.use(require('./middlewares/logger'))

// 错误处理
const errorHandler = require('./middlewares/error')
app.use(errorHandler)


// 请求体解析
app.use(koaBody({
  multipart: true,
  formidable: {
    maxFileSize: 200 * 1024 * 1024 // 设置上传文件大小最大限制，默认2M
  }
}))

// 前端资源文件
const staticPath = path.join(__dirname, './web/MS_OAuth2API_Next_Web/dist')
app.use(static(staticPath, {
  maxage: 365 * 24 * 60 * 60 * 1000,
  gzip: true,
  index: 'index.html'
}))

// 路由
const router = require('./routes')
app.use(router.routes()).use(router.allowedMethods())

app.use(async (ctx, next) => {
  // 如果已经有响应体，直接返回
  if (ctx.body || ctx.status !== 404) {
    return await next()
  }

  // 如果是 API 请求，不处理
  if (ctx.path.startsWith('/api') || ctx.path.includes('.')) {
    return await next()
  }

  try {
    const indexPath = path.join(staticPath, 'index.html')
    if (fs.existsSync(indexPath)) {
      ctx.type = 'html'
      ctx.body = fs.createReadStream(indexPath)
    } else {
      ctx.status = 404
      ctx.body = 'Vue index.html not found'
    }
  } catch (error) {
    logger.error('Error serving index.html:', error)
    ctx.status = 500
    ctx.body = 'Internal Server Error'
  }
})

// 启动服务
const PORT = config.port || 3000
app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`)
})

module.exports = app
