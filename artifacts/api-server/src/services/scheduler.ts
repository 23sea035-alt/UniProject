import { markOverdueBills, checkGracePeriods } from './billing.js';
import { checkOfflineDevices } from './device.js';
import { logger } from '../lib/logger.js';

let intervals: NodeJS.Timeout[] = [];

export function startScheduler() {
  logger.info('Starting background scheduler...');

  // Check overdue bills and grace periods every hour
  const billingInterval = setInterval(async () => {
    try {
      await markOverdueBills();
      await checkGracePeriods();
    } catch (err) {
      logger.error({ err }, 'Error in billing scheduler');
    }
  }, 60 * 60 * 1000);

  // Check offline devices every 5 minutes
  const deviceInterval = setInterval(async () => {
    try {
      await checkOfflineDevices();
    } catch (err) {
      logger.error({ err }, 'Error in device health scheduler');
    }
  }, 5 * 60 * 1000);

  intervals.push(billingInterval, deviceInterval);
  logger.info('Background scheduler started');
}

export function stopScheduler() {
  for (const interval of intervals) {
    clearInterval(interval);
  }
  intervals = [];
  logger.info('Background scheduler stopped');
}
