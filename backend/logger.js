const pino = require('pino');

const isDev = process.env.NODE_ENV !== 'production';

const logger = pino(
  isDev
    ? {
        level: 'debug',
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
        },
      }
    : {
        level: 'info',
      },
);

module.exports = logger;
