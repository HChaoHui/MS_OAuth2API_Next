const winston = require('winston')
const DailyRotateFile = require('winston-daily-rotate-file')
const config = require('../config')
const { combine, timestamp, printf, colorize } = winston.format

const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`
})

const logger = winston.createLogger({
  level: config.log.level,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      )
    }),
    // 每日轮换文件日志
    new DailyRotateFile({
      filename: `${config.log.dir}/application-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
})

// 生产环境下只记录到文件
if (config.env === 'production') {
  logger.remove(winston.transports.Console)
}

module.exports = logger
