import { createLogger, VueLogger } from 'vue-logger-plugin';

export type VCMapLogger = VueLogger & { 
  time: typeof console.time;
  timeEnd: typeof console.timeEnd;
};

const LOG_LEVEL = (process.env.NODE_ENV === 'development') ? 'debug' : 'warn';

const logger = createLogger({
  enabled: true,
  level: LOG_LEVEL,
}) as VCMapLogger;


// Add logger.time methods to our custom logger
logger.time = (message: string) => {
  if (LOG_LEVEL === 'debug')
    console.time(`[TIME] ${message}`);
}
logger.timeEnd = (message: string) => {
  if (LOG_LEVEL === 'debug')
    console.timeEnd(`[TIME] ${message}`);
}

export default logger;