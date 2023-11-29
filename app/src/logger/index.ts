import { createLogger, LogLevel, VueLogger } from 'vue-logger-plugin';
import config from '@/../config/app.config';

export type VCMapLogger = VueLogger & { 
  time: typeof console.time;
  timeEnd: typeof console.timeEnd;
};

type VCMapLogLevel = LogLevel | 'time';

let logLevel: VCMapLogLevel | 'time' = 'info';
if (!config.LOG_LEVEL) {
  logLevel = (process.env.NODE_ENV === 'development') ? 'debug' : 'warn';
} else {
  logLevel = config.LOG_LEVEL as VCMapLogLevel;
}

const logger = createLogger({
  enabled: true,
  // 'time' is the same as 'debug' from the plugin's perspective
  level: logLevel === 'time' ? 'debug' : logLevel,
}) as VCMapLogger;

logger.info(`==== LOG LEVEL: ${logLevel} ====`);

// Add logger.time methods to our custom logger
logger.time = (message: string) => {
  if (logLevel === 'time')
    console.time(`[TIME] ${message}`);
};
logger.timeEnd = (message: string) => {
  if (logLevel === 'time')
    console.timeEnd(`[TIME] ${message}`);
};

export default logger;