import { createLogger } from 'vue-logger-plugin';

const logger = createLogger({
  enabled: true,
  level: (process.env.NODE_ENV === 'development') ? 'debug' : 'warn',
});

export default logger;