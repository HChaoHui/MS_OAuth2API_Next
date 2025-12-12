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

// 静态资源
app.use(static(path.join(__dirname, '../public')))

// 请求体解析
app.use(koaBody({
  multipart: true,
  formidable: {
    maxFileSize: 200 * 1024 * 1024 // 设置上传文件大小最大限制，默认2M
  }
}))

// 路由
const router = require('./routes')
app.use(router.routes()).use(router.allowedMethods())

// 启动服务
const PORT = config.port || 3000
app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`)
})

module.exports = app
