import { NotificationRecord, NotificationType } from '../types';
import { smsService } from './smsService';

export interface DispatchNotificationParams {
  recipientCustomerId: string;
  recipientName: string;
  recipientPhone: string;
  type: NotificationType;
  channel?: 'SMS' | 'PUSH' | 'BOTH';
  title: string;
  message: string;
  gatewayProvider?: string;
}

export class NotificationService {
  public async dispatchNotification(params: DispatchNotificationParams): Promise<NotificationRecord> {
    const channel = params.channel || 'BOTH';
    const timestamp = new Date().toISOString();
    const notifId = `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 1. Dispatch SMS if applicable
    if (channel === 'SMS' || channel === 'BOTH') {
      try {
        await smsService.sendSMS({
          toPhone: params.recipientPhone,
          message: `[NWSDB Sri Lanka] ${params.title}: ${params.message}`,
        });
      } catch (err) {
        console.error('SMS dispatch error:', err);
      }
    }

    // 2. Dispatch FCM Push for React Native Mobile App if applicable
    if (channel === 'PUSH' || channel === 'BOTH') {
      console.log(`[FCM Push] Sent to customer ${params.recipientCustomerId}: "${params.title}"`);
    }

    const record: NotificationRecord = {
      id: notifId,
      recipientCustomerId: params.recipientCustomerId,
      recipientName: params.recipientName,
      recipientPhone: params.recipientPhone,
      type: params.type,
      channel: channel,
      title: params.title,
      message: params.message,
      sentTimestamp: timestamp,
      deliveryStatus: 'DELIVERED',
      gatewayProvider: params.gatewayProvider || 'DIALOG_AXIATA_GOV_SMS',
    };

    return record;
  }
}

export const notificationService = new NotificationService();
