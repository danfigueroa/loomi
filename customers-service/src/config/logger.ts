import { createLogger, format, transports } from 'winston';

const { combine, timestamp, errors, json, colorize, simple } = format;

const logger = createLogger({
  level: process.env['LOG_LEVEL'] || 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: { service: 'customers-service' },
  transports: [
    new transports.Console({
      format: combine(
        colorize(),
        simple()
      )
    })
  ],
});

// Adicionar transports de arquivo apenas se o diretório existir
try {
  const fs = require('fs');
  if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs', { recursive: true });
  }
  
  logger.add(new transports.File({ filename: 'logs/error.log', level: 'error' }));
  logger.add(new transports.File({ filename: 'logs/combined.log' }));
} catch (error) {
  console.error('Erro ao configurar logs de arquivo:', error);
}

export { logger };